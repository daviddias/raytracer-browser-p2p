var srt = require('simple-raytracer');

module.exports = function (self) {
    self.addEventListener('message', function(ev) {

      // console.log('FROM Worker: ', ev);
      self.postMessage({
        id: ev.data.task.id,
        result: {
          begin_x: ev.data.task.begin_x,
          end_x: ev.data.task.end_x,
          begin_y: ev.data.task.begin_y,
          end_y: ev.data.task.end_y,
          animation: ev.data.task.animation,
          data: srt.runTask(ev.data.scene, ev.data.task).data          
        }
      });
    });
};