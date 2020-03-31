# OAuth Demos

## The demo includes

- Grant Type: Authorization Code

The demo comprises of three servers:

- **Client server**

  The starting point. It requests a token from the Authorization
  and uses it to get the content from the resource server

- **Authorization server**

  Authorizes the request from the user and generates a signed token

- **Resource server**

  Will serve a resource if it receives a valid JWT, it will check the signature

## Get started

### Prerequisites

- Docker
- Docker compose
- Git

### Setup and run

- Open `terminal` and navigate to `dir` of your choice
- Run (one of)
  - `git clone https://github.com/mrosenquist/oauth-demo.git`
  - `git clone git@github.com:mrosenquist/oauth-demo.git`
- Run `cd oauth-demo`
- Run `docker-compose up --build`
- Open web browser at http://localhost:8080 and follow the flow
- Login with user: `john` pass: `secret`

## Explanation of work

### The example files are in the following directories

- `client-server`
- `authorization-server`
- `resource-server`

_Note: the `shared` directory houses as much as possible of the code that runs the servers or sets up the database, but is not needed to understand the auth flows all the code for the is in the directories above_

### The key files are as follows, the documented with in the files:

- `client-server/routes/step1.start.js`
  - Creates the link to the OAuth Server
  - And show a user interface
- `authorization-server/routes/step2.authorize.js`
  - Read the information and asks the user if they wish to _accept_ or _decline_ the request
  - Send the use back to the client server with an _authorization code_
- `client-server/routes/step3.callback.js`
  - Check the details received
  - Exchanges the _authorization code_ for an _access token_
- `authorization-server/routes/step4.get-token.js`
  - Check the details received
  - Generate a JWT
- `authorization-server/helpers/step5.generate-jwt.js`
  - Generate a JWT access token and sign it
- Continue from `client-server/routes/step3.callback.js`
  - Uses the access token to fetch content
- `resource-server/routes/step6.get-resource.js`
- `resource-server/helpers/step7.jwt-decode-verify.js`
  Verify the JWT access token
  Send back the content
- Continue from `client-server/routes/step3.callback.js`
  - Display the content
- `client-server/templates/step8-show-resource.html`

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

### Keeping it simple & design decisions

- **No HTTPS**

  Due to running in a local dev environment and now wanting to install self-signed keys/root keys on to a machine are run HTTP and no HTTPS. In reality, all connection would be using HTTPS.

- **OAuth v2 Authorization Code Only**

  OAuth v1 requires more signing and for this wanted to keep it simple. The Authorization Code is a good example of the server to server communication which is more relevant to what the team would do.

- **No API Setup interfaces**

  This is a one-off process that would have added a lot of complexity adding UIs and API calls for the creation/registering of an application on the auth server. I have assumed this has been set-up and so the details are preloaded

- **No refresh token**

  Have not included a "refresh token" to keep the code simple

- **No PKCE**

  The flow is "Authorization Code" flow only without PKCE (as mainly for SPA's)

- **RS512 for signing**
  Only used RS512 to sign. It's using a more future proof SHA and using the RSA priv/public crypto which means the checking server doesn't need a secret. _RSA_ is well known and faster than using _ECDSA_

- **User Authentication using Basic**

  Used a simple authentication using Basic Auth to just have a simple working demo, authentication should be handled separately to authorization. Basic means the browser handles the interface

### Core dependencies

- Node + NPM
- Hapi JS: A simple & secure HTTP server, that is easy to use (simpler than express)
- Joi: A simple validation libraries
- Paper CSS: A lightweight CSS framework which is good for UI prototype
- Mongoose + Mongo as a persistence store for the server only

### Resources used during the creation

- https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2
- https://blog.angular-university.io/angular-jwt/
- https://medium.com/@siddharthac6/json-web-token-jwt-the-right-way-of-implementing-with-node-js-65b8915d550e
- https://medium.com/capgemini-norway/oauth2-authorization-patterns-and-microservices-45ffc67a8541
- https://auth0.com/docs/tokens
- https://auth0.com/docs/flows/guides/auth-code/call-api-auth-code
- https://en.wikipedia.org/wiki/JSON_Web_Token
- https://tools.ietf.org/html/rfc8725
