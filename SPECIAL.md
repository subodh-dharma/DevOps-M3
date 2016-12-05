# CSC 791 - DevOps Project - Special Milestone

## Team

* Aniket Patel (apatel10)
* Subodh Dharmadhikari (ssdharma)
* Matrika Rohatgi (mrohatgi)

### Special Milestone

#### Architecture

The system consists of following components:
* Build Server - Jenkins
* Redis Server
* Proxy Server
* Application Server

The deployment of each server is controlled using git branches, Jenkins and Ansible playbooks. The repository contains branches namely `/master`, `/redis` and `/proxy` to deploy any configurations or application logic to Application Server, Redis Server and Proxy Server respectively. The build and deployment is performed at each push to respective branch.

This strategy helps in maintaining a continuous build and deployment pipeline.

#### Features

###### _Monitoring Services_

The system has two monitoring services deployed. Both work on Application servers.
1. Request Monitor - This monitor calculates the number of request received at each application server individually. The count is updated continuously to Redis server in a hash table with the name same as that of the IP address of the app server.
2. Memory Monitor - This monitor uses `os-monitor` npm package to check the memory usage of the system periodically. This service also updates the redis server with memory_load hash table.

###### _Auto Scaling_

The 
