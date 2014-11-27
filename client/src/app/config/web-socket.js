'use strict';

angular.module('metrics')
  .config(function(WebSocketProvider) {
    WebSocketProvider.prefix('').uri('ws://localhost:5050/admin/system/metrics');
  });
