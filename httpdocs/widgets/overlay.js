/* -*- mode: espresso; espresso-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set softtabstop=2 shiftwidth=2 tabstop=2 expandtab: */

// active treenode or connector
var atn = null;
var atn_fillcolor = "rgb(0, 255, 0)";

function activateNode(node) {
  // changes the color attributes of
  // the newly activated node
  if (atn !== null) {
    atn.setDefaultColor();
  }
  // if node === null, just deactivate
  if (node === null) {
    atn = null;
    return;
  }
  atn = node;
  atn.getC().attr({
    fill: atn_fillcolor
  });
  // update statusBar
  if (atn.type === "treenode") {
    statusBar.replaceLast("activated treenode with id " + atn.id);
  } else {
    statusBar.replaceLast("activated node with id " + atn.id);
  }
}

SVGOverlay = function (
resolution, translation, dimension, // dimension of the stack
current_scale // current scale of the stack
) {

  this.resolution = resolution;
  this.translation = translation;
  this.dimension = dimension;

  var speedtoggle = false;
  var nodes = {};
  var labels = {};
  var show_labels = false;

  this.exportSWC = function () {
    // retrieve SWC file of currently active treenode's skeleton
    var recipe = window.open('', 'RecipeWindow', 'width=600,height=600');

    requestQueue.register("model/export.skeleton.php", "GET", {
      pid: project.id,
      tnid: atn.id
    }, function (status, text, xml) {
      if (status === 200) {

        $('#recipe1').clone().appendTo('#myprintrecipe');
        var html = "<html><head><title>Skeleton as SWC</title></head><body><pre><div id='myprintrecipe'>" + text + "</div></pre></body></html>";
        recipe.document.open();
        recipe.document.write(html);
        recipe.document.close();




      }
    }); // endfunction
  };

  this.selectNode = function (id) {
    var nodeid;
    // activates the given node id if it exists
    // in the current retrieved set of nodes
    for (nodeid in nodes) {
      if (nodes.hasOwnProperty(nodeid)) {
        if (nodes[nodeid].id === id) {
          activateNode(nodes[nodeid]);
        }
      }
    }
  };

  this.showTags = function (val) {
    this.toggleLabels(val);
  };

  this.toggleLabels = function (toval) {
    var labid, nods = {}, nodeid;

    for (labid in labels) {
      if (labels.hasOwnProperty(labid)) {
        labels[labid].remove();
      }
    }
    labels = {};

    // update state variable
    if (toval === null) {
      if (show_labels) {
        show_labels = false;
      } else {
        show_labels = true;
      }
    } else {
      show_labels = toval;
    }

    // retrieve labels for the set of currently visible nodes
    if (show_labels) {
      // retrieve all currently existing
      // create node id array
      for (nodeid in nodes) {
        if (nodes.hasOwnProperty(nodeid)) {
          if (nodes[nodeid].zdiff === 0) {
            nods[nodeid] = nodeid;
          }
        }
      }
      jQuery.ajax({
        url: "model/label.node.list.all.php",
        type: "POST",
        data: {
          nods: JSON.stringify(nods),
          pid: project.id
        },
        dataType: "json",
        beforeSend: function (x) {
          if (x && x.overrideMimeType) {
            x.overrideMimeType("application/json;charset=UTF-8");
          }
        },
        success: function (result) {
          var nodeitems = result, nodeid;

          // for all retrieved, create a label
          for (nodeid in nodeitems) {
            if (nodeitems.hasOwnProperty(nodeid)) {
              var tl = new OverlayLabel(nodeitems[nodeid], r, nodes[nodeid].x, nodes[nodeid].y, nodeitems[nodeid]);
              // console.log(tl);
              labels[nodeid] = tl;
            }
          }
        }
      });
    }

  };

  this.tagATN = function () {

    // tagbox from
    // http://blog.crazybeavers.se/wp-content/demos/jquery.tag.editor/
    if ($("#tagBoxId" + atn.id).length !== 0) {
      alert("TagBox is already open!");
      return;
    }

    var e = $("<div class='tagBox' id='tagBoxId" + atn.id + "' style='z-index: 8; border: 1px solid #B3B2B2; padding: 5px; left: " + atn.x + "px; top: " + atn.y + "px;'>" +
    //var e = $("<div class='tagBox' id='tagBoxId' style='z-index: 7; left: 0px; top: 0px; color:white; bgcolor:blue;font-size:12pt'>" +
    "Tag (id:" + atn.id + "): <input id='Tags" + atn.id + "' name='Tags' type='text' value='' />" + "<button id='SaveCloseButton" + atn.id + "'>Save</button>" + "<button id='CloseButton" + atn.id + "'>Cancel</button>" + "</div>");
    e.onclick = function (e) {
      e.stopPropagation();
      return true;
    };
    e.css('background-color', 'white');
    //e.css('width', '200px');
    //e.css('height', '200px');
    e.css('position', 'absolute');
    e.appendTo("#sliceSVGOverlayId");

    // update click event handling
    $("#tagBoxId" + atn.id).click(function (event) {
      // console.log(event);
      event.stopPropagation();
    });

    // add autocompletion
    requestQueue.register("model/label.all.list.php", "POST", {
      pid: project.id
    }, function (status, text, xml) {

      if (status === 200) {
        if (text && text !== " ") {
          var e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            var availableTags = $.parseJSON(text);
            $("#Tags" + atn.id).autocomplete({
              source: availableTags
            });
          }
        }
      }
    }); // endfunction
    requestQueue.register("model/label.node.list.php", "POST", {
      pid: project.id,
      nid: atn.id,
      ntype: atn.type
    }, function (status, text, xml) {

      if (status === 200) {
        if (text && text !== " ") {
          var e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            var nodeitems = $.parseJSON(text);
            // retrieved nodeitems should be for active
            // node anyways
            $("#Tags" + atn.id).tagEditor({
              items: nodeitems[atn.id],
              confirmRemoval: true,
              completeOnSeparator: true
            });
            $("#Tags" + atn.id).focus();

          }
        }
      }
    }); // endfunction
    $("#CloseButton" + atn.id).click(function (event) {
      // save and close
      // alert($("#Tags" + atn.id).tagEditorGetTags());
      $("#tagBoxId" + atn.id).remove();
      event.stopPropagation();
    });

    $("#SaveCloseButton" + atn.id).click(function (event) {
      // save and close
      requestQueue.register("model/label.update.php", "POST", {
        pid: project.id,
        nid: atn.id,
        ntype: atn.type,
        tags: $("#Tags" + atn.id).tagEditorGetTags()
      }, function (status, text, xml) {

        if (status === 200) {
          if (text && text !== " ") {
            var e = $.parseJSON(text);
            if (e.error) {
              alert(e.error);
            } else {
              project.showTags(true);
            }
          }
        }
      }); // endfunction
      $("#tagBoxId" + atn.id).remove();
      event.stopPropagation();
    });


  };

  this.rerootSkeleton = function () {
    if (confirm("Do you really want to to reroot the skeleton?")) {
      requestQueue.register("model/treenode.reroot.php", "POST", {
        pid: project.id,
        tnid: atn.id
      }, function (status, text, xml) {
        if (status === 200) {
          if (text && text !== " ") {
            var e = $.parseJSON(text);
            if (e.error) {
              alert(e.error);
            } else {
              // just redraw all for now
              project.updateNodes();
            }
          } // endif
        } // end if
      }); // endfunction
    }
  };

  this.splitSkeleton = function () {
    if (confirm("Do you really want to to split the skeleton?")) {
      requestQueue.register("model/treenode.split.php", "POST", {
        pid: project.id,
        tnid: atn.id
      }, function (status, text, xml) {
        if (status === 200) {
          if (text && text !== " ") {
            var e = $.parseJSON(text);
            if (e.error) {
              alert(e.error);
            } else {
              // just redraw all for now
              project.updateNodes();
            }
          } // endif
        } // end if
      }); // endfunction
    }
  };

  this.createTreenodeLink = function (fromid, toid) {
    // first make sure to reroot target
    requestQueue.register("model/treenode.reroot.php", "POST", {
      pid: project.id,
      tnid: toid
    }, function (status, text, xml) {
      if (status === 200) {
        if (text && text !== " ") {
          var e = $.parseJSON(text);
          // console.log(e);
          if (e.error) {
            alert(e.error);
          } else {
            // just redraw all for now
            project.updateNodes();
          }
        } // endif
      } // end if
    }); // endfunction
    // then link again
    requestQueue.register("model/treenode.link.php", "POST", {
      pid: project.id,
      from_id: fromid,
      to_id: toid
    }, function (status, text, xml) {
      if (status === 200) {
        if (text && text !== " ") {
          var e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            nodes[toid].parent = nodes[fromid];
            // update the parents children
            nodes[fromid].children[toid] = nodes[toid];
            nodes[toid].draw();
            nodes[fromid].draw();
            // make target active treenode
            activateNode(nodes[toid]);
          }
        }
      }
      return true;
    });
    return;
  };

  this.createLink = function (fromid, toid, link_type, from_type, to_type, from_nodetype, to_nodetype) {

    requestQueue.register("model/link.create.php", "POST", {
      pid: project.id,
      from_id: fromid,
      from_relation: 'model_of',
      from_type: from_type,
      from_nodetype: from_nodetype,
      link_type: link_type,
      to_id: toid,
      to_type: to_type,
      to_nodetype: to_nodetype,
      to_relation: 'model_of'
    }, function (status, text, xml) {
      if (status === 200) {
        if (text && text !== " ") {
          var e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            // just redraw all for now
            project.updateNodes();
          }
        }
      }
      return true;
    });
    return;
  };

  var createSingleConnector = function (phys_x, phys_y, phys_z, pos_x, pos_y, pos_z, confval) {
    // create a single connector with a synapse instance that is
    // not linked to any treenode
    requestQueue.register("model/connector.create.php", "POST", {
      pid: project.id,
      class_instance_type: 'synapse',
      class_instance_relation: 'model_of',
      confidence: confval,
      x: phys_x,
      y: phys_y,
      z: phys_z
    }, function (status, text, xml) {
      if (status === 200) {
        if (text && text !== " ") {
          var e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            // add treenode to the display and update it
            var jso = $.parseJSON(text);
            var cid = parseInt(jso.connector_id, 10);

            var nn = new ConnectorNode(cid, r, 8, pos_x, pos_y, pos_z, 0);
            nodes[cid] = nn;
            nn.draw();
            activateNode(nn);
          }
        } // endif
      } // end if
    }); // endfunction
  };

  var createConnector = function (locidval, id, phys_x, phys_y, phys_z, pos_x, pos_y, pos_z) {
    var ip_type, iplre, locid;
    //console.log("start: locidval", locidval, "id", id);
    // id is treenode id
    if (locidval === null) {
      // we have the presynaptic case
      ip_type = 'presynaptic terminal';
      iplre = 'presynaptic_to';
      locid = 0;
    } else {
      // we have the postsynaptic case where the location and synapse is already existing
      ip_type = 'postsynaptic terminal';
      iplre = 'postsynaptic_to';
      locid = locidval;
    }

    requestQueue.register("model/treenode.connector.create.php", "POST", {
      pid: project.id,
      input_id: id,
      input_relation: 'model_of',
      input_type: ip_type,
      input_location_relation: iplre,
      x: phys_x,
      y: phys_y,
      z: phys_z,
      location_id: locid,
      location_type: 'synapse',
      location_relation: 'model_of'
    }, function (status, text, xml) {
      if (status === 200) {
        if (text && text !== " ") {
          var e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            // add treenode to the display and update it
            var jso = $.parseJSON(text);
            var locid_retrieved = parseInt(jso.location_id, 10);
            //alert("locid retrieved"+ locid_retrieved);
            //console.log("handler: locidval", locidval, "id", id);
            if (locidval === null) {
              // presynaptic case
              var nn = new ConnectorNode(locid_retrieved, r, 8, pos_x, pos_y, pos_z, 0);

              // take the currently activated treenode into the pregroup
              nn.pregroup[id] = nodes[id];
              nodes[locid_retrieved] = nn;
              nn.draw();
              // update the reference to the connector from the treenode
              nodes[id].connectors[locid_retrieved] = nn;
              // activate the newly created connector
              activateNode(nn);
            } else {
              // do not need to create a new connector, already existing
              // need to update the postgroup with corresponding original treenode
              //console.log("existing syn", nodes[locid_retrieved], "locid", locid,  "retrieved", locid_retrieved);
              nodes[locid_retrieved].postgroup[id] = nodes[id];
              // do not activate anything but redraw
              nodes[locid_retrieved].draw();
              // update the reference to the connector from the treenode
              nodes[id].connectors[locid_retrieved] = nodes[locid_retrieved];
            }

          }
        }
      }
      return true;
    });
    return;
  };

  var createNodeWithConnector = function (locid, phys_x, phys_y, phys_z, radius, confidence, pos_x, pos_y, pos_z) {
    // no parent exists
    // this is invoked to create a new node giving a location_id for a postynaptic linking
    var parid = -1;
    requestQueue.register("model/treenode.create.php", "POST", {
      pid: project.id,
      parent_id: parid,
      x: phys_x,
      y: phys_y,
      z: phys_z,
      radius: radius,
      confidence: confidence,
      targetgroup: "Isolated synaptic terminals"
    }, function (status, text, xml) {
      var nn, jso, e, tnid;
      if (status === 200) {
        if (text && text !== " ") {
          e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            // add treenode to the display and update it
            jso = $.parseJSON(text);
            if (parid === -1) {
              nn = new Node(jso.treenode_id, r, null, radius, pos_x, pos_y, pos_z, 0);
            } else {
              nn = new Node(jso.treenode_id, r, nodes[parid], radius, pos_x, pos_y, pos_z, 0);
            }

            nodes[jso.treenode_id] = nn;
            nn.draw();
            //activateNode( nn );
            // grab the treenode id
            tnid = jso.treenode_id;

            //console.log("treenode id to use for the create connector", tnid, "with locid", locid);
            // create connector : new atn postsynaptic_to deactivated atn.id (location)
            createConnector(locid, tnid, phys_x, phys_y, phys_z, pos_x, pos_y, pos_z);

          }
        }
      }
      return true;
    });
    return;

  };

  var createNode = function (parentid, phys_x, phys_y, phys_z, radius, confidence, pos_x, pos_y, pos_z) {

    var parid, selneuron, useneuron;

    if (!parentid) {
      parid = -1;
    } else {
      parid = parentid.id;
    }

    // check if we want the newly create node to be
    // a model of a neuron
    selneuron = project.selectedObjects.selectedneuron;
    if (selneuron !== null) {
      useneuron = selneuron;
    } else {
      useneuron = -1;
    }

    requestQueue.register("model/treenode.create.php", "POST", {
      pid: project.id,
      parent_id: parid,
      x: phys_x,
      y: phys_y,
      z: phys_z,
      radius: radius,
      confidence: confidence,
      targetgroup: "Fragments",
      useneuron: useneuron
    }, function (status, text, xml) {
      var e, jso, nn;
      if (status === 200) {
        if (text && text !== " ") {
          e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
          } else {
            // add treenode to the display and update it
            jso = $.parseJSON(text);
            if (parid === -1) {
              nn = new Node(jso.treenode_id, r, null, radius, pos_x, pos_y, pos_z, 0);
            } else {
              nn = new Node(jso.treenode_id, r, nodes[parid], radius, pos_x, pos_y, pos_z, 0);
            }

            nodes[jso.treenode_id] = nn;
            nn.draw();
            activateNode(nn);

          }
        }
      }
      return true;
    });
    return;
  };

  var updateNodePositions = function (nodeArray, completedCallback) {
    var requestDicitionary = {}, i, k, node, callback;
    for (i in nodeArray) {
      if (nodeArray.hasOwnProperty(i)) {
        requestDicitionary['pid' + i] = project.id;
        node = nodeArray[i];
        for (k in node) {
          if (node.hasOwnProperty(k)) {
            requestDicitionary[k + i] = node[k];
          }
        }
      }
    }
    callback = function (status, text, xml) {
      var e;
      if (status === 200) {
        if (text && text !== " ") {
          e = $.parseJSON(text);
          if (e.error) {
            alert(e.error);
            completedCallback(-1);
          } else {
            if (completedCallback) {
              completedCallback(e.updated);
            }
          }
        }
      }
      return true;
    };
    requestQueue.register("model/node.update.php", "POST", requestDicitionary, callback);
  };

  this.updateNodeCoordinatesinDB = function (completedCallback) {
    var nodesToUpdate = [], i, phys_x, phys_y, phys_z;
    for (i in nodes) {
      if (nodes.hasOwnProperty(i)) {
        // only updated nodes that need sync, e.g.
        // when they changed position
        if (nodes[i].needsync) {
          // get physical
          phys_x = this.pix2physX(nodes[i].x);
          phys_y = this.pix2physY(nodes[i].y);
          phys_z = this.pix2physZ(nodes[i].z);
          nodes[i].needsync = false;

          nodesToUpdate.push({
            'node_id': nodes[i].id,
            'x': phys_x,
            'y': phys_y,
            'z': phys_z,
            'type': nodes[i].type
          });
        }
      }
    }
    if (nodesToUpdate.length > 0) {
      updateNodePositions(nodesToUpdate, completedCallback);
    } else {
      if (completedCallback) {
        completedCallback(0);
      }
    }
  };

  var updateNodeCoordinates = function (newscale) {
    var i, x, y, fact;
    // depending on the scale, update all the node coordinates
    for (i = 0; i < nodes.length; ++i) {
      x = nodes[i].x;
      y = nodes[i].y;
      fact = newscale / s;
      xnew = Math.floor(x * fact);
      ynew = Math.floor(y * fact);
      // use call to get the function working on this
      this.setXY.call(nodes[i], xnew, ynew);
    }
  };

  this.refreshNodes = function (jso) {
    var nrtn = 0, nrcn = 0, i, j, id, pos_x, pos_y, pos_z, zdiff, rad, nn, nid, parid;

    this.paper.clear();
    nodes = {};
    labels = {};
    // deactive node, but keep id for reactivation
/*if(atn!=null) {
      oldatnid = atn.id;
      console.log("XXX:oldatnid", oldatnid);
    }*/

    // activateNode(null);
    for (i in jso) {
      if (jso.hasOwnProperty(i)) {
        id = parseInt(jso[i].id, 10);
        pos_x = this.phys2pixX(jso[i].x);
        pos_y = this.phys2pixY(jso[i].y);
        pos_z = this.phys2pixZ(jso[i].z);
        zdiff = Math.floor(parseFloat(jso[i].z_diff) / resolution.z);
        if (zdiff === 0) {
          if (jso[i].type === "treenode") {
            rad = parseFloat(jso[i].radius);
          } else {
            rad = 8; // default radius for locations
          }
        } else {
          rad = 0;
        }

        if (jso[i].type === "treenode") {
          nn = new Node(id, this.paper, null, rad, pos_x, pos_y, pos_z, zdiff);
          nrtn++;
        } else {
          nn = new ConnectorNode(id, this.paper, rad, pos_x, pos_y, pos_z, zdiff);
          nrcn++;
        }
        nodes[id] = nn;
        // keep active state of previous active node
        if (atn !== null && atn.id === id) {
          activateNode(nn);
        }
      }
    }
    if (speedtoggle) {
      // loop again and add correct parent objects and parent's children update
      for (i in jso) {
        if (jso.hasOwnProperty(i)) {
          nid = parseInt(jso[i].id, 10);
          // for treenodes, make updates
          if (jso[i].type === "treenode") {
            parid = parseInt(jso[i].parentid, 10);

            if (nodes[parid]) {
              // if parent is existing, update the references
              nodes[nid].parent = nodes[parid];
              // update the parents children
              nodes[nid].parent.children[nid] = nodes[nid];
            }

          } else if (jso[i].type === "location") {
            // update pregroup and postgroup
            for (j in jso[i].pre) {
              if (jso[i].pre.hasOwnProperty(j)) {
                // check if presynaptic trenode id in list, if so,
                // link to its pbject
                preloctnid = parseInt(jso[i].pre[j].tnid, 10);
                if (nodes.hasOwnProperty(preloctnid)) {
                  // add presyn treenode to pregroup of
                  // the location object
                  nodes[nid].pregroup[preloctnid] = nodes[preloctnid];
                  // add to pregroup of treenode
                  nodes[preloctnid].connectors[nid] = nodes[nid];
                }
              }
            }
            for (j in jso[i].post) {
              if (jso[i].post.hasOwnProperty(j)) {
                // do the same for the post
                postloctnid = parseInt(jso[i].post[j].tnid, 10);
                if (nodes.hasOwnProperty(postloctnid)) {
                  nodes[nid].postgroup[postloctnid] = nodes[postloctnid];
                  // add to postgroup of treenode (for nice drawing later)
                  nodes[postloctnid].connectors[nid] = nodes[nid];
                }
              }
            }
          }
        }
      }
      // draw nodes
      for (i in nodes) {
        if (nodes.hasOwnProperty(i)) {
          nodes[i].draw();
        }
      }

    } // end speed toggle
    // statusBar.replaceLast( "[" + pos_x.toFixed( 3 ) + ", " + pos_y.toFixed( 3 ) + "]" );
    // debugging the node retrieval
    //    statusBar.replaceLast( "number of treenodes (retrieved): " + nrtn +"; number of connectors: " + nrcn);
    // show tags if necessary again
    this.showTags(show_labels);
    // show nodes
    // console.log(nodes);
  };

  this.update = function (newViewWidth,  newViewHeight) {
    this.view.style.width = newViewWidth + "px";
    this.view.style.height = newViewHeight + "px";
    r.setSize(newViewWidth, newViewWidth);
  }

  this.redraw = function (
  ns //!< scale factor to be applied to resolution [and fontsize]
  ) {

    // check if new scale changed, if so, update all node coordinates
    if (ns !== s) {
      updateNodeCoordinates(ns);
    }
    // update the scale of the internal scale variable
    s = ns;
  };

  this.set_tracing_mode = function (mode) {
    // toggels the button correctly
    // might update the mouse pointer
    document.getElementById("trace_button_skeleton").className = "button";
    document.getElementById("trace_button_synapse").className = "button";

    if (mode === "skeletontracing") {
      currentmode = mode;
      document.getElementById("trace_button_skeleton").className = "button_active";
    } else if (currentmode === "skeletontracing") {
      currentmode = mode;
      document.getElementById("trace_button_synapse").className = "button_active";
    }
  };

  var getMode = function (e) {
    return currentmode;
  };

  this.getView = function () {
    return view;
  };

  var self = this;

  this.onclick = function (e) {
    var locid;
    var m = ui.getMouse(e);

    // take into account current local offset coordinates and scale
    var pos_x = m.offsetX;
    var pos_y = m.offsetY;
    var pos_z = self.phys2pixZ(project.coordinates.z);

    // get physical coordinates for node position creation
    var phys_x = self.pix2physX(pos_x);
    var phys_y = self.pix2physY(pos_y);
    var phys_z = project.coordinates.z;

    if (e.ctrlKey) {
      // ctrl-click deselects the current active node
      if (atn !== null) {
        statusBar.replaceLast("deactivated active node with id " + atn.id);
      }
      activateNode(null);
    } else if (e.shiftKey) {
      if (atn === null) {
        if (getMode() === "skeletontracing") {
          alert("You need to activate a treenode first (skeleton tracing mode)");
          return true;
        }
      } else {
        if (atn instanceof Node) {
          // here we could create new synapse presynaptic to the activated treenode
          // remove the automatic synapse creation for now
          // the user has to change into the synapsedropping mode and add the
          // connector, then active the original treenode again, and shift-click
          // on the target connector to link them presynaptically
          statusBar.replaceLast("created connector presynaptic to treenode with id " + atn.id);
          createConnector(null, atn.id, phys_x, phys_y, phys_z, pos_x, pos_y, pos_z);
          e.stopPropagation();
          return true;
        } else if (atn instanceof ConnectorNode) {
          // create new treenode (and skeleton) postsynaptic to activated connector
          // deactiveate atn, cache atn id
          locid = atn.id;
          // keep connector active because you might want
          // to quickly add several postsynaptic treenodes
          //activateNode( null );
          // create root node, creates a new active node
          // because the treenode creation is asynchronous, we have to invoke
          // the connector creation in the event handler
          statusBar.replaceLast("created connector postsynaptic to treenode with id " + atn.id);
          createNodeWithConnector(locid, phys_x, phys_y, phys_z, -1, 5, pos_x, pos_y, pos_z);
          e.stopPropagation();
          return true;
        }
      }
    } else {
      // depending on what mode we are in
      // do something else when clicking
      if (getMode() === "skeletontracing") {
        if (atn instanceof Node || atn === null) {
          // create a new treenode,
          // either root node if atn is null, or child if
          // it is not null
          if (atn !== null) {
            statusBar.replaceLast("created new treenode as child of treenode" + atn.id);
          }
          createNode(atn, phys_x, phys_y, phys_z, -1, 5, pos_x, pos_y, pos_z);
          e.stopPropagation();
          return true;
        }
      } else if (getMode() === "synapsedropping") {
        // only create single synapses/connectors
        createSingleConnector(phys_x, phys_y, phys_z, pos_x, pos_y, pos_z, 5);
      }
    }
    e.stopPropagation();
    return true;
  };

  // currently there are two modes: skeletontracing and synapsedropping
  var currentmode = "skeletontracing";
  this.set_tracing_mode(currentmode);

  var view = document.createElement("div");
  view.className = "sliceSVGOverlay";
  view.id = "sliceSVGOverlayId";
  view.onclick = this.onclick;
  view.style.zIndex = 6;
  view.style.cursor = "crosshair";
  // make view accessible from outside for setting additional mouse handlers
  this.view = view;


  var s = current_scale;
  var r = Raphael(view, Math.floor(dimension.x * s), Math.floor(dimension.y * s));
  this.paper = r;

  this.phys2pixX = function (x) {
    return (((x - translation.x) - project.coordinates.x) / resolution.x) * s + (view.offsetWidth / 2);
  };
  this.phys2pixY = function (y) {
    return (((y - translation.y) - project.coordinates.y) / resolution.y) * s + (view.offsetHeight / 2);
  };
  this.phys2pixZ = function (z) {
    return (z - translation.z) / resolution.z;
  };

  this.pix2physX = function (x) {
    return translation.x + project.coordinates.x + (x - (view.offsetWidth / 2)) * resolution.x / s;
  };
  this.pix2physY = function (y) {
    return translation.y + project.coordinates.y + (y - (view.offsetHeight / 2)) * resolution.y / s;
  };
  this.pix2physZ = function (z) {
    return translation.z + z * resolution.z;
  };

  this.show = function () {
    view.style.display = "block";
  };
  this.hide = function () {
    view.style.display = "none";
  };

  $('input#speedtoggle').change(function () {
    if ($(this).attr("checked")) {
      //do the stuff that you would do when 'checked'
      speedtoggle = true;
      project.updateNodes();
      return;
    } else {
      speedtoggle = false;
      project.updateNodes();
      return;
    }
    //Here do the stuff you want to do when 'unchecked'
  });

};
