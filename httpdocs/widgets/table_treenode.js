/* -*- mode: espresso; espresso-indent-level: 2; indent-tabs-mode: nil -*- */
/* vim: set softtabstop=2 shiftwidth=2 tabstop=2 expandtab: */


function updateTreenodeTable() {
  TreenodeTable.init( project.getId() );
}

var TreenodeTable = new function()
{
  var ns = this; // reference to the namespace
  ns.oTable = null;
  var asInitVals = [];
  var skelid;

  this.init = function (pid)
  {
    ns.pid = pid;
    ns.oTable = $('#treenodetable').dataTable({
      // http://www.datatables.net/usage/options
      "bDestroy": true,
      "sDom": '<"H"lr>t<"F"ip>',
      // default: <"H"lfr>t<"F"ip>
      "bProcessing": true,
      "bServerSide": true,
      "bAutoWidth": false,
      "sAjaxSource": 'model/treenode.table.list.php',
      "fnServerData": function (sSource, aoData, fnCallback) {
        var key;
        // remove all selected elements in table
        for (var key in project.selectedObjects.table_treenode) {
          if (project.selectedObjects.table_treenode.hasOwnProperty(key)) {
            // FIXME: use splice(1,1) instead
            delete project.selectedObjects.table_treenode[key];
          }
        }

        skelid = SkeletonAnnotations.getActiveSkeletonId();
        if (skelid !== null) {
          // give priority to showing treenodes
          aoData.push({
            "name": "skeleton_0",
            "value": skelid
          });
          aoData.push({
            "name": "skeleton_nr",
            "value": 1
          });
        } else {
          // check if a treenode is active
          // send active treenode when set
          var atnID = SkeletonAnnotations.getActiveNodeId();
          if (atnID && SkeletonAnnotations.getActiveNodeType() === "treenode") {
            aoData.push({
              "name": "atnid",
              "value": atnID
            });
          }
        }

        aoData.push({
          "name": "pid",
          "value": pid
        });

        $.ajax({
          "dataType": 'json',
          "type": "POST",
          "url": sSource,
          "data": aoData,
          "success": fnCallback
        });
      },
      "iDisplayLength": -1,
      "aLengthMenu": [
        [-1, 10, 100, 200],
        ["All", 10, 100, 200]
      ],
      "bJQueryUI": true,
      "fnDrawCallback": function () {
        $('td:eq(5)', ns.oTable.fnGetNodes()).editable('model/treenode.table.update.php', {
          "callback": function (sValue, y) {},
          "submitdata": function (value, settings) {
            var aPos = ns.oTable.fnGetPosition(this);
            var aData = ns.oTable.fnGetData(aPos[0]);
            return {
              "id": aData[0],
              "type": "confidence",
              "pid": project.id
            };
          },
          "height": "14px"
        });
      },
      "fnRowCallback": function (nRow, aData, iDisplayIndex) {

        if (aData[1] === "R") {
          $(nRow).addClass('root_node');
        }
        if (aData[1] === "L") {
          $(nRow).addClass('leaf_node');
        }

        var atnID = SkeletonAnnotations.getActiveNodeId();
        if (atnID) {
          if (parseInt(aData[0], 10) === atnID) {
            // just to be sure
            $(nRow).removeClass('root_node');
            $(nRow).removeClass('leaf_node');
            // highlight row of active treenode
            $(nRow).addClass('highlight_active');
          }
        }
        return nRow;
      },
      "aoColumns": [{
        "sClass": "center",
        "bSearchable": false,
        "bSortable": true,
        "bVisible": false
      }, // id
      {
        "sClass": "center",
        "bSearchable": true,
        "bSortable": false,
        "sWidth": "50px"
      }, // type
      {
        "bSearchable": true,
        "bSortable": false,
        "sWidth": "150px"
      }, // labels
      {
        "sClass": "center",
        "bSearchable": false,
        "sWidth": "50px"
      }, // confidence
      {
        "sClass": "center",
        "bSearchable": false
      }, // x
      {
        "sClass": "center",
        "bSearchable": false
      }, // y
      {
        "sClass": "center",
        "bSearchable": false
      }, // z
      {
        "sClass": "center",
        "bSearchable": false
      }, // radius
      {
        "bSearchable": false
      }, // username
      {
        "bSearchable": false,
        "bSortable": true
      } // last modified
      ]
    });

    // filter table
    $.each(asInitVals, function(index, value) {
      if(value==="Search")
        return;
      ns.oTable.fnFilter(value, index);
    });

    $("#treenodetable thead input").keyup(function () { /* Filter on the column (the index) of this element */
      ns.oTable.fnFilter(this.value, $("thead input").index(this));
      asInitVals[$("thead input").index(this)] = this.value;
    });

  /*
   * Support functions to provide a little bit of 'user friendlyness' to the textboxes in
   * the footer
   */

    $("#treenodetable thead input").each(function (i) {
      asInitVals[i] = this.value;
    });

    $("#treenodetable thead input").focus(function () {
      if (this.className === "search_init") {
        this.className = "";
        this.value = "";
      }
    });

    $("#treenodetable thead input").blur(function (i) {
      if (this.value === "") {
        this.className = "search_init";
        this.value = asInitVals[$("thead input").index(this)];
      }
    });

    $("#treenodetable tbody tr").live('dblclick', function () {

      var aData = ns.oTable.fnGetData(this);
      // retrieve coordinates and moveTo
      var x = parseFloat(aData[4]);
      var y = parseFloat(aData[5]);
      var z = parseFloat(aData[6]);
      project.moveTo(z, y, x);

      // activate the node with a delay
      var id = parseInt(aData[0], 10);
      window.setTimeout("SkeletonAnnotations.staticSelectNode(" + id + "," + skelid + ")", 1000);

    });
  };
}