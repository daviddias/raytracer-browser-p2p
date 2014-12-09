var ring = require('webrtc-ring');
var srt = require('simple-raytracer');
var fs = require('fs');
var workify = require('webworkify');
var log = require('bows')('rbp2p');
var domready = require('domready');

window.app = {
  init: function () {
    var nodeConfig = { 
      signalingURL: 'http://localhost:9000',
      logging: false
    };

    var startTime;
    var endTime;
    var scene;
    var tasks;
    var N_UNITS;
    var N_BROWSERS = 5;
    var results = {};
    var resultsCount = 0;
    var node = ring.createNode(nodeConfig);

    node.e.on('ready', ready);
    node.e.on('message', messageReceived);

    function ready() {
      log('node is ready');

      // prepare the scene

      var scene_file = fs.readFileSync('./scenes/pokeball.rt', 'utf8');
      scene = srt.prepareScene.byFile(scene_file);
      N_UNITS = 5;

      tasks = srt.prepareTasks({
        split: N_UNITS, 
        width: scene.global.width,
        height: scene.global.height
      });      

      // enable interaction to start through a button

      domready(function () {
        var body = document.querySelector('body');
        body.innerHTML = '<button>DO IT</button>';
        var button = document.querySelector('body');
        button.addEventListener('click', idsLookup);
      });
    }

    function idsLookup() {
      startTime = Date.now();
      log('Started at: ', startTime);
      // 1. query for nodes available
      node.sendSucessor({
        type: 'id-gossip',
        origin: node.id(),
        idsAvailable: []
      });
    }

    function startDecentralizedRaytracing(nodeIds) {
      log('my id and idsAvailable: ', node.id(), nodeIds);
      // 2. send tasks
      var tasksPerBrowser = (N_UNITS * N_UNITS) / N_BROWSERS;

      function sendMessages(offset, remaindingIds) {
        if(offset === (N_UNITS * N_UNITS)){
          return;
        }
        var destId = remaindingIds.shift();

        for(var i=0;i<tasksPerBrowser;i++) {
          node.send(destId, {
                              type: 'task',
                              task: 'hey this is a task',
                              origin: node.id()
                            });
          log('send task to: ', destId);
        }

        sendMessages(offset + tasksPerBrowser, remaindingIds); 
      }
      sendMessages(0, nodeIds);

    }

    function messageReceived(message) {
      if (message.type === 'task') {
        log('Received Task');
        node.send(message.origin, {
                                    type: 'result',
                                    result: {
                                      id: Math.random() + '',
                                      data: 'some result data'
                                    }
                                  });
      }
      if (message.type === 'result') {
        log('Received result');
        results[message.result.id] = message.result.data;
        resultsCount += 1;
        if(resultsCount === N_UNITS * N_UNITS){
          finalize();
        }
        // add to the result array
        // if end, finalize()
      }

      if (message.type === 'id-gossip') {
        if (message.origin === node.id()){
          startDecentralizedRaytracing(message.idsAvailable);
        } else {
          message.idsAvailable.push(node.id());
          node.sendSucessor(message);
        }
        // add my id to the id array and pass it along
        // if it was me that started, startDecentralized Raytracing
      }

    }

    function finalize() {
      endTime = Date.now();
      log('Ended at: ', endTime);
    }

    // var w = workify(require('./raytracer-worker.js'));
    // w.addEventListener('message', function (ev) {
    //     console.log(ev.data);
    // });

    // w.postMessage(4); // send the worker a message


  }
};

window.app.init();