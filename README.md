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

* v0.0.1 - NPM Package Information
* v0.0.5 - Added Configuration Tweaks, fixed links and mongodb problems ([Full Release Information](https://github.com/datitisev/node-flarum/releases/tag/0.0.5))
