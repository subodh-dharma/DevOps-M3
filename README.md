# DevOps-M3

# Milestone 3 - DevOps

## Project Components

* **Build Server**

  When a developer commits the code to the repository, build server fetches the recent commit and checks the build status of the repository.

  We have used Jenkins as the build server and with the Github Webhooks, the recent commit of the data is fetched and build activities are performed on them.

  Based on the branch on which the push is made, Jenkins performs respective activities and deploys on respective hosts.

  Following are three main build activities based on branches that are deployed:
  * Production - `/master`, The application hosted
  * Proxy - `/proxy`, The proxy server settings and port forwarding logic
  * Redis Store - `/redis`, The global redis store available to production and proxy servers.


* **Proxy Server**

  Hosts the Nginx webserver and acts as a proxy server. Proxy server connects to the Production servers. Internally, Proxy Server will distribute requests to the available production and canary server based on their availabiltiy.

* **Redis Store**

  A global Redis Store is hosted which helps to control the features, active servers to be used by proxy.

* **Production Servers**

  Hosts the application logic.

* **Canary Server**

  Hosts the application logic to be tested viz. new feature or beta version of the application logic.
