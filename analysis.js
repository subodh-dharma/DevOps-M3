var esprima = require("esprima");
var options = {
    tokens: true,
    tolerant: true,
    loc: true,
    range: true
};
var fs = require("fs");
var path = require("path");
var promise = require("promise");
var builder = [];

function main() {

    // reading current directory
    return new Promise(function(resolve, reject) {
        var args = process.argv.slice(2);

        if (args.length == 0) {
            args = ["analysis.js"];
        }
        var filePath = args[0];

        fs.readdir('./', function(err, files) {
            for (f in files) {
                if (path.extname(files[f]) === '.js') {
                    complexity(files[f]);
                    console.log('********* ' + files[f]);
                    for (var node in builders) {
                        builder = builders[node];
                        //  builder.report();
                    }
                }
            }
            resolve(builders);
        });

    });


    //complexity(filePath);

    // Report
    // for (var node in builders) {
    //     var builder = builders[node];
    //     builder.report();
    // }

}

var builders = {};

// Represent a reusable "class" following the Builder pattern.
function FunctionBuilder() {
    this.StartLine = 0;
    this.FunctionName = "";
    // The number of parameters for functions
    this.ParameterCount = 0;
    // Number of if statements/loops + 1
    this.SimpleCyclomaticComplexity = 1;
    // The max depth of scopes (nested ifs, loops, etc)
    this.MaxNestingDepth = 0;
    // The max number of conditions if one decision statement.
    this.MaxConditions = 0;
    //longest message chain
    this.MessageChain = 0;
    // The number of return statements
    this.ReturnStmts = 0;

    this.report = function() {
        console.log(
            (
                "{0}(): {1}\n" +
                "============\n" +
                "SimpleCyclomaticComplexity: {2}\t" +
                "MaxNestingDepth: {3}\t" +
                "MaxConditions: {4}\t" +
                "Parameters: {5}\t" +
                "Return Statements: {6}\t" +
                "Message Chain Length: {7}" + "\n\n"
            )
            .format(this.FunctionName, this.StartLine,
                this.SimpleCyclomaticComplexity, this.MaxNestingDepth,
                this.MaxConditions, this.ParameterCount, this.ReturnStmts, this.MessageChain)
        );
    }
};

// A builder for storing file level information.
function FileBuilder() {
    this.FileName = "";
    // Number of strings in a file.
    this.Strings = 0;
    // Number of imports in a file.
    this.ImportCount = 0;
    // Number of Conditons in a file.
    this.Conditions = 0;

    this.report = function() {
        console.log(
            ("{0}\n" +
                "~~~~~~~~~~~~\n" +
                "ImportCount {1}\t" +
                "Strings {2}\t" +
                "Conditions {3}\n"
            ).format(this.FileName, this.ImportCount, this.Strings, this.Conditions));
    }
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor) {
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') {
                child.parent = object;
                traverseWithParents(child, visitor);
            }
        }
    }
}

function complexity(filePath) {
    var buf = fs.readFileSync(filePath, "utf8");
    var ast = esprima.parse(buf, options);

    var i = 0;

    // A file level-builder:
    var fileBuilder = new FileBuilder();
    fileBuilder.FileName = filePath;
    fileBuilder.ImportCount = 0;
    builders[fileBuilder.filePath] = fileBuilder;

    var visited = {};

    // Tranverse program with a function visitor.
    traverseWithParents(ast, function(node) {
        if (node.type === 'FunctionDeclaration') {
            var builder = new FunctionBuilder();
            //console.log("# of parameters " + node.params.length);
            // 1b ParameterCount
            builder.ParameterCount = node.params.length;

            traverseWithParents(node, function(child) {

                if (isDecision(child)) {
                    // 2a SimpleCyclomaticComplexity
                    builder.SimpleCyclomaticComplexity += 1;

                    if (child.type == "IfStatement") {
                        var conditioncount = 1;
                        traverseWithParents(child.test, function(ifchild) {
                            if (ifchild.type == "LogicalExpression") {
                                conditioncount++;
                            }
                        });
                        //3a MaxConditions in a function
                        if (conditioncount > builder.MaxConditions) {
                            builder.MaxConditions = conditioncount;
                        }
                    }


                    //3b Max Nesting
                    var cnt = 1;

                    if (child.type === "IfStatement") {

                        traverseWithParents(child.consequent, function max(nest) {

                            if (isDecision(nest)) {
                                if (!nest.visited) {
                                    nest.visited = true;
                                    cnt++;
                                    //console.log(nest.test.name, cnt);
                                    if (nest.type == "IfStatement")
                                        traverseWithParents(nest.consequent, max);
                                    else
                                        traverseWithParents(nest.body, max);

                                    if (builder.MaxNestingDepth < cnt) {
                                        builder.MaxNestingDepth = cnt;
                                    }
                                    cnt--;
                                }
                            }

                        });

                    } else {

                        traverseWithParents(child.body, function max(nest) {


                            if (isDecision(nest)) {
                                if (!nest.visited) {
                                    nest.visited = true;
                                    cnt++;
                                    //console.log(nest.test.name, cnt);
                                    if (nest.type == "IfStatement")
                                        traverseWithParents(nest.consequent, max);
                                    else
                                        traverseWithParents(nest.body, max);

                                    if (builder.MaxNestingDepth < cnt) {
                                        builder.MaxNestingDepth = cnt;
                                    }
                                    cnt--;
                                }
                            }

                        });

                    }

                    if (cnt == 1 && builder.MaxNestingDepth == 0) {
                        builder.MaxNestingDepth = 1;
                    }
                }
            });



            // 1d Number of Return Statements
            traverseWithParents(node, function(child) {
                if (child.type === 'ReturnStatement') {
                    builder.ReturnStmts += 1;
                }
            });


            //2b Message Chain Length
            traverseWithParents(node, function(child) {
                if (child.type === 'MemberExpression') {
                    var mcount = 0;
                    traverseWithParents(child, function(memchild) {
                        if (memchild.type === 'MemberExpression') {
                            mcount++;
                        }
                    });

                    if (mcount > builder.MessageChain) {
                        builder.MessageChain = mcount;
                    }
                }
            });

            builder.FunctionName = functionName(node);
            builder.StartLine = node.loc.start.line;

            builders[builder.FunctionName] = builder;
        } else if (node.type == 'Literal' && (typeof(node.value) == "string")) {
            // 1a String Count in File
            fileBuilder.Strings += 1;
        } else if (node.type == 'CallExpression' && node.callee.name == 'require') {
            // 1c Package complexity
            fileBuilder.ImportCount += 1;
        } else if (isDecision(node) && node.type != "ForInStatement") {
            // 1e All Conditions
            fileBuilder.Conditions += 1;
            // check for  binary or unary expression
            traverseWithParents(node.test, function(ifchild) {

                if (ifchild.type == "LogicalExpression") {
                    fileBuilder.Conditions += 1;
                }
            });

        }

    });

}

// Helper function for counting children of node.
function childrenLength(node) {
    var key, child;
    var count = 0;
    for (key in node) {
        if (node.hasOwnProperty(key)) {
            child = node[key];
            if (typeof child === 'object' && child !== null && key != 'parent') {
                count++;
            }
        }
    }
    return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node) {
    if (node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
        node.type == 'ForInStatement' || node.type == 'DoWhileStatement') {
        return true;
    }
    return false;
}

// Helper function for printing out function name.
function functionName(node) {
    if (node.id) {
        return node.id.name;
    }
    return "anon function @" + node.loc.start.line;
}

// Helper function for allowing parameterized formatting of strings.
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ?
                args[number] :
                match;
        });
    };
}

exports.main = main;
//exports = FunctionBuilder;
//module.exports = builder;
