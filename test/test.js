var request = require('supertest');
var express = require('../main.js');

describe('Testing Main Server!', function() {

    this.timeout(15000);


    it('Check Server is up!', function connectTest(done) {
        request(express).get('/').expect(200, done);
    });

    it('Check Time request', function historyTest(done) {
        request(express).get('/time').expect(200, done);
    });

    it('Check for non-existing page', function check404(done) {
        request(express).get('/notexists').expect(404, done);
    });

});
