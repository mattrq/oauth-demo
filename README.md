# OAuth Demos

## The demo includes

- Grant Type: Authorization Code

The demo comprises of three servers:

- Client server
- Authorization server
- Resource server

## Get started

### Prerequisites

- Docker
- Docker compose
- Git

### Setup and run

- Open `terminal` and navigate to `dir` of your choice
- Run `git clone https://github.com/mrosenquist/oauth-demo.git` or `git clone git@github.com:mrosenquist/oauth-demo.git`
- RUN `cd oauth-demo`
- Run `docker-compose up --build`
- Open web browser at http://localhost:8080 and follow the flow
- Login with user: `john` pass: `secret`

## Explanation of work

**The example files are in the following directories**

- client-server
- authorization-server
- resource-server

_Note: the `shared` directory houses much of the code that runs the servers or sets up the database, but is not needed to understand the auth flows_

The key files are as follows, the documented with in the files:

- `client-server/routes/step1.start.js`
  Creates the link to the OAuth Server
  And show a user interface
- `authorization-server/routes/step2.authorize.js`
  Read the information and asks the user if they wish to _accept_ or _decline_ the request
  Send the use back to the client server with an _authorization code_
- `client-server/routes/step3.callback.js`
  Check the details received
  Exchanges the _authorization code_ for an _access token_
- `authorization-server/routes/step4.get-token.js`
  Check the details received
  Generate a JWT
- `authorization-server/helpers/step5.generate-jwt.js`
  Generate a JWT access token and sign it
- Continue from `client-server/routes/step3.callback.js`
  Uses the access token to fetch content
- `resource-server/routes/step6.get-resource.js`
  Verify the JWT access token
  Send back the content
- Continue from `client-server/routes/step3.callback.js`
  Display the content
- `client-server/templates/step7-show-resource.html`

### The request flow diagram

```text

         Client Site                 Auth Server             Content Server
     http://localhost:8080      http://localhost:8081     http://localhost:8082
---------------------------------------------------------------------------------------
/                  |                       |                 | # User navigates to a web site http://localhost:8080
                   |                       |                 |
  (click) ------------> /oauth/authorize --|                 | # Login, user: john, password: secret
                   |                       |                 |
/auth/callback <------------- (click) -----|                 | # User clicks on "Accept"
                   |                       |                 |
  (server call)    |--> /oauth/token       |                 | # Exchange token for "access token"
                   |                       |                 |
  (receive token) <------------ (token)) --|                 | # Send "access details" including a "access token" as a JWT
                   |                       |                 | # Signed using RS512
                   |                       |                 |
  (fetch content) ----------------------------> /content/123 | # Request content using "access token" as Bearer
                   |                       |                 | # Content server validates token using public key
 (receive content)<------------------------------------------| # Content server sends back content
                   |                       |                 |
 (display content) |                       |                 | # Display content to the user

```

### Keeping it simple

- Due to running in a local dev environment and now wanting to install self-signed keys/root keys on to a machine are run HTTP and no HTTPS. In a reality, all connection would be using HTTP S
- OAuth v1, only using 0Auth v2 flows
- UI or API calls for the creation/registering of an application on the auth server. I have assumed this has been set-up and so the details are preloaded
- Have not included a "refresh token" to keep the code simple
- The flow is "Authorization Code" flo only without PKCE (as mainly for SPA's)
- Only used RS512 to sign
- Used a simple authentication using Basic Auth to just have a simple working demo, authentication should be handle seperately to authorization

### Core dependencies

- Node + NPM
- Hapi JS: A simple & secure HTTP server, that is easy to use (simpler than express)
- Joi: A simple validation libraries
- Paper CSS: A lightweight CSS framework which is good for UI prototype
- Mongoose + Mongo as a persistance store for the server only

### Resources used during the creation

- https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2
- https://blog.angular-university.io/angular-jwt/
- https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e
- https://medium.com/capgemini-norway/oauth2-authorization-patterns-and-microservices-45ffc67a8541
- https://auth0.com/docs/tokens
- https://auth0.com/docs/flows/guides/auth-code/call-api-auth-code
- https://en.wikipedia.org/wiki/JSON_Web_Token
- https://tools.ietf.org/html/rfc8725
