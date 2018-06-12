# X.Scraper 

Service for scrapping \ serving \ checking (via X.Meter) proxies

## Deployment via docker

You need Graylog2 server and any [implementation](https://github.com/FireX-Proxy/X.Meter.Api) of X.Meter server.  
Check configuration lines at [.env](https://github.com/FireX-Proxy/X.Scraper/blob/master/.env)  
And you are good to go with Docker.
```
$ docker-compose up -d
```

## Manual deployment

```
$ git clone https://github.com/FireX-Proxy/X.Scraper
$ cd X.Scraper
$ npm install
```

Then configure PostgreSQL, Graylog2, X.Meter server and write necessary lines to .env file
Then use
```
$ npm run start
```

## Built With

* [Swagger](http://swagger.io) - OpenAPI
* [Typescript](https://www.typescriptlang.org/) - Language which make it possible
* [Sequelize.js](http://docs.sequelizejs.com/) - Great ORM framework for SQL databases.


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details