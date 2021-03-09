**Steps  to deploy in local machine**

1) Check out the code from github at

2) Once you check out the code navigate into the root directory on the terminal

3) Using npm run the command "npm install"

4) Open the file config/application.properties on your favourite editor and set the value for mongodb.connection.url property

5) The property app.api.key holds the value for the api key that you need to use in headers for authenticating the API calls the header name to be used in "**apikey**" and its value must be set to the string value of the property "**app.api.key**" 

6) The postman collection in shared in the root folder with the name "**ssnpages.postman_collection**"

7) The routes for user CRUD operation is to be called with /users path

    POST /users
    
    GET /users
    
    GET /users/:userid
    
    PUT /users/:userid
    
    DELETE /users/:userid (Does soft delete of user i.e Status:Inactive)

8) the routes for page CRUD operation is to be called with /users path

    POST /pages
    
    GET /pages
    
    GET /pages/:userid
    
    PUT /pages/:userid
    
    DELETE /pages/:userid   (Does hard delete for the Page record)
    
9) The application with bind to the default port 3000, you can change the port in the application.properties file for the key "**app.http.port**"

10) You can also set the domain name in the application.properties file by editing the value for the key "**app.http.domain**"

**Note**: The code has been build on NodeJS LTS version **14.16.0** and NPM version **7.6.1**
    
    
    