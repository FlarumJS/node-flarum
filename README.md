# node-flarum

A forum made out of [Flarum](http://flarum.org)'s design forum with NodeJS

## Installation

```sh
npm install node-flarum --save
```


## Usage

### HTTP


```node
var http = require('http');
var flarum = require('node-flarum');

http.createServer(flarum).listen(3000);
```

### Express

```node
var flarum = require('node-flarum');

var express = require('express');
var app = express();

// Other stuff

app.use('/forum', flarum) // This will execute flarum on the "/forum" path
app.use(flarum)           // This will execute flarum on the root path
```



## Contributing

Whenever this forum is complete [•••], there will be a website here for the official *NodeJS* Flarum forum


## Release History

* v0.0.1 [ADDED] NPM Package Information
* v0.0.5
  * [ADDED] MongoDB Config To Installation Screen
  * [ADDED] Config File in path/to/project/flarum/config.json
  * [FIXED] Had to restart node process after installation for mongodb
  * [FIXED] Links on forum would point to root, not forum path
  * [FIXED] AngularJS Requests & Font Awesome
