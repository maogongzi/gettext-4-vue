<template>
  <!-- Attention: this dialog has been heavily modified in it's
    appearance regarding the following aspects:
    1. lack of a x close button in edit mode
    2. lack of the whole `footer` section(but in edit mode we still reuse
    the ok and cancel button events, which will be mapped to "Save" and
    "Discard" respectively)
  -->
  <basic-dialog
    :display="display"
    :dialogTitle="`${mode === 'edit' ? 'Edit' : 'View'} Flow`"
    :showXBtn="mode === 'view'"
    :showFooter="false"
    :class="[`flow-dialog--${mode}`]"
    class="flow-dialog"
    @beforeOpen="initDialog"
    @closeDialog="close"
  >
    <div class="flow-dialog__flow clearfix">
      <div class="flow-dialog__flow-info">
        <p class="flow-dialog__flow-info-name">
          <label>
            {{ $_("Name") }}:
            {{ $_("Name") }}:
            {{ $p_("used for name label", "Name") }}:
            {{ $p_("", "Name") }}:
            {{ $n_("Name", "Names", 2) }}:
            {{ $np_("used for name label", "Name", "Names", 2) }}:
          </label>

          {{ flowName }}
        </p>

        <p class="flow-dialog__flow-info-desc">
          <label>Description:</label>

          <span
            :title="flowDesc"
            :class="{
              'flow-dialog__flow-info-desc-field--edit': showEditDesc
            }"
            class="flow-dialog__flow-info-desc-field"
          >
            <span class="flow-dialog__flow-info-desc-field-txt">
              {{ flowDesc }}
            </span>

            <template v-if="showEditDesc">
              <input
                v-model="flowDesc"
                type="text"
                class="flow-dialog__flow-info-desc-field-input"
              />
            </template>
          </span>

          <!-- only in "edit" mode do we allow editing the
            description -->
          <template v-if="mode === 'edit'">
            <template v-if="showEditDesc">
              <a
                href="javascript:;"
                class="flow-dialog__flow-info-desc-save"
                title="Finish editing"
                @click="showEditDesc = false"
              >
                <i class="icon icon__check"></i>
              </a>
            </template>
            <template v-else>
              <a
                href="javascript:;"
                class="flow-dialog__flow-info-desc-edit"
                title="Edit flow description"
                @click="showEditDesc = true"
              >
                <i class="icon icon__pen"></i>
              </a>
            </template>
          </template>
        </p>
      </div>

      <!-- save btns(only available in "edit" mode) -->
      <template v-if="mode === 'edit'">
        <div class="flow-dialog__flow-actions">
          <btn
            title="Discard flow changes"
            fill="ghost"
            @click="cancelBtnClick"
          >
            <i class="icon icon__discard"></i>
            {{ $_("Discard") }}
          </btn>

          <btn
            title="Save flow changes"
            @click="okBtnClick"
          >
            <i class="icon icon__save"></i>
            Save
          </btn>
        </div>
      </template>
    </div>

    <!-- flex layout -->
    <div class="flow-dialog__editor">
      <div class="flow-dialog__editor-types">
        <template v-for="item in jobTypes">
          <!-- hide root node -->
          <template v-if="item.name !== 'root'">
            <!-- uncomment this to add hint to the job type, p.s. remember
              to remove the native `title` to avoid conflicts

              v-popover:typeHint.right="item.name"
            -->
            <div
              :id="`flow-dialog-draggable-node-${item.name}`"
              :key="item.id"
              :title="item.name"
              :class="`flow-dialog__editor-types-item--${item.name}`"
              class="flow-dialog__editor-types-item"
            >
              <i
                :class="`icon__${item.name}`"
                class="icon"
              ></i>
              {{ item.name }}
            </div>
          </template>
        </template>
      </div>

      <!-- canvas section -->
      <div
        :class="{
          'flow-dialog__editor-canvas--capturing': draggingActivated,
          'flow-dialog__editor-canvas--expanded': controlsVisible
        }"
        class="flow-dialog__editor-canvas"
      >
        <flowchart
          ref="canvas"
          :key="chartUUID"
          :nodes="nodes"
          :conns="conns"
          :hoverNodeId="hoverNodeId"
          :nodeActions="generateNodeActions"
          :detachedNodes="detachedNodes"
          :circularConns="circularConns"
          :mode="mode"
          @callAction="callAction"
          @changeNodes="changeNodes"
          @changeConns="changeConns"
        ></flowchart>
      </div>

      <!-- control panel -->
      <slide-out-panel
        :visible="controlsVisible"
        @changeVisible="changeControlVisible"
      >
        <tabs
          :activeTabName="activeTabName"
          :lazy="true"
          theme="basic"
          @changeTab="changeTabs"
        >
          <tabs-pane
            tabName="graphTab"
            tabLabel="Flow Graph"
          >
            <flow-node-filter
              ref="flowNodeFilter"
              :viewNodeDetails="true"
              :nodes="nodes"
              :mode="mode"
              flowType="flow"
              @editNode="showEditNode"
              @viewNode="viewNode"
              @deleteNode="confirmDeleteJob"
              @hoverNode="changeHoverNode"
            ></flow-node-filter>
          </tabs-pane>

          <!-- history tabs is available only in "edit" mode -->
          <template v-if="mode === 'edit'">
            <tabs-pane
              tabName="historyTab"
              tabLabel="Flow History"
            >
              <flow-versions-table
                :records="versions"
                :versionCheckMap="versionCheckMap"
                @changeVersion="changeFlowVersion"
              ></flow-versions-table>
            </tabs-pane>
          </template>
        </tabs>
      </slide-out-panel>
    </div>

    <template v-slot:appended>
      <!-- use 1 as z-index because we want the hint to stay above the tools
        buttons of the flowchart -->
      <popover
        ref="typeHint"
        :zIndex="1"
        @triggered="triggerHint"
      >
        <!-- job type hint -->
        <div class="flow-dialog__hint">
          Job type:
          <strong class="flow-dialog__hint-name">{{ typeHintName }}</strong>
        </div>
      </popover>

      <job-dialog
        :display="displayJobDialog"
        :mode="manageNodeMode"
        :flowId="flowId"
        :node="pendingNode"
        :jobTypes="jobTypes"
        @okClicked="manageNode"
        @closeDialog="displayJobDialog = false"
      ></job-dialog>

      <!-- safe flow dialog -->
      <save-flow-dialog
        :display="displaySaveFlowDialog"
        :flow="flowInfo ? flowInfo.flow_info : null"
        @okClicked="saveFlow"
        @closeDialog="displaySaveFlowDialog = false"
      ></save-flow-dialog>
    </template>
  </basic-dialog>
</template>

<script>
  import dagre from "dagre";
  import { jsPlumb } from "jsplumb";
  import APIService from "__shared-libs/js/modules/api-service";
  import generateUUID from "__shared-libs/js/modules/generate-uuid";
  import adapterMixin from "__shared-libs/components/dialog/adapter-mixin";
  import refreshNodeUUID from "__libs/js/modules/refresh-node-uuid";
  import unifyNodeFormat from "__libs/js/modules/unify-node-format";
  import Flowchart from "__libs/components/flowchart/Flowchart";
  import FlowNodeFilter from "__libs/components/FlowNodeFilter";
  import JobDialog from "__libs/components/jobs/JobDialog";
  import SlideOutPanel from "__libs/components/SlideOutPanel";
  import SaveFlowDialog from "__libs/components/SaveFlowDialog";
  import chartMethodsMixin from "__libs/components/flowchart/chart-methods-mixin";
  import FlowVersionsTable from "./FlowVersionsTable";

  export default {
    name: "flow-dialog",

    components: {
      Flowchart,
      FlowNodeFilter,
      JobDialog,
      SaveFlowDialog,
      SlideOutPanel,
      FlowVersionsTable
    },

    mixins: [adapterMixin, chartMethodsMixin],

    props: {
      // using mode: edit / view
      mode: {
        type: String,
        default: "edit",
        validator(str) {
          return ["edit", "view"].includes(str);
        }
      },

      // timeout(in seconds) to refresh the editing lock
      pollTimeout: {
        type: Number,
        default: 60
      },

      // flow object
      flowInfo: {
        type: Object,
        default: null
      },

      // originated from the old "globalJobTypes" state
      jobTypes: {
        type: Array,
        default() {
          return [];
        }
      }
    },

    data() {
      return {
        // active job type name that triggers the hint popover
        typeHintName: null,

        showEditDesc: false,

        // see comments below in initDialog
        chartUUID: generateUUID(),

        flowId: null,
        flowName: "",
        flowDesc: "",
        conns: [],
        nodes: [],
        versions: [],
        // stores the checked state of each version(should update it after
        // version list changes)
        versionCheckMap: {},
        hoverNodeId: null,
        // nodes that doesn't match the flow rules, e.g. detached node
        detachedNodes: [],

        // connections that doesn't match the flow rules, e.g.
        // circular reference
        // [{source, target}]
        circularConns: [],

        displayJobDialog: false,
        // mode: edit / create / readonly
        manageNodeMode: "create",
        // the node which has been dragged into the canvas.
        pendingNode: null,

        controlsVisible: true,

        activeTabName: "graphTab",

        displaySaveFlowDialog: false,

        // indicates that user has started dragging a type from the left
        // panel
        draggingActivated: false
      };
    },

    mounted() {
      // note that drag-and-drop action is available only in "edit" mode,
      // but as the dialog may be reused in different modes, we'll enable
      // the functionality but visually hide the draggable types to "disable"
      // it in "view" mode.
      this.jsPlumbDragInst = jsPlumb.getInstance();

      // drag to add new node
      this.jsPlumbDragInst.draggable(
        this.$el.querySelectorAll(".flow-dialog__editor-types-item"),
        {
          scope: "scope-drag-to-add",
          // use a clone to drag around
          clone: true,
          // append the clone node as a child of this element
          // @see
          //    https://github.com/JordyvanDortmont/katavorio/
          //    blob/2fb0d42f64c44e15493766b2cf52ad2145fcc3c1/src/
          //    katavorio.js#L398-L417
          parent: this.$el.querySelector(".flow-dialog__editor"),
          dragClass: "flow-dialog__editor-types-item--draggable",
          // after dragging starts highlight the droppable area
          start: () => {
            this.draggingActivated = true;
          },
          // after dragging stops stop highlighting the droppable area
          stop: () => {
            this.draggingActivated = false;
          }
        }
      );

      // drop to confirm adding new node
      this.jsPlumbDragInst.droppable(
        this.$el.querySelector(".flow-dialog__editor-canvas"),
        {
          scope: "scope-drag-to-add",
          drop: (evt) => {
            let { canvasX, canvasY } = this.$refs.canvas.panzoom;

            this.pendingNode = {
              // offsetX/Y: calculate position based on the left top corner of
              // the droppable container
              //
              // should subtract the offset of the canvas as it might not
              // be at the original position at current moment.
              left: parseInt(evt.e.offsetX - canvasX),
              top: parseInt(evt.e.offsetY - canvasY),
              scope: "job",
              type: evt.drag.el.id.split("-").pop()
            };

            this.manageNodeMode = "create";
            this.displayJobDialog = true;

            return true;
          }
        }
      );
    },

    // skip unnecessary data observation on some properties.
    created() {
      // instance used to support drag-and-drop action
      this.jsPlumbDragInst = null;
      this.refreshLockTimer = null;
    },

    methods: {
      initDialog() {
        this.flowId = this.flowInfo.flow_info.id;
        this.flowName = this.flowInfo.flow_info.name;
        this.flowDesc = this.flowInfo.flow_info.description;
        this.versions = this.flowInfo.versions;
        this.refreshCheckMap(this.flowInfo.current_version);

        // switch back to first tabs
        this.activeTabName = "graphTab";

        // make visible the slide out panel
        this.controlsVisible = true;

        // since the flow dialog will be reused in different modes, we need to
        // make sure each time after it opens the jsPlumb lib re-renders the
        // canvas completely, otherwise it will confuse some cached states,
        // for example: switch from mode 'edit' to 'view' will cause the
        // connections to be removeable as it uses the last config from 'edit'
        // mode
        this.chartUUID = generateUUID();

        this.changeNodes(unifyNodeFormat(this.flowInfo.jobs, this.jobTypes));
        this.changeConns(this.flowInfo.conns);

        // for "edit" mode:
        //   1. once the dialog opens, peoridically update the lock
        //   2. once it's closed, stop the timer. see close() hook
        if (this.mode === "edit") {
          this.refreshLock();
        }
      },

      // proxy to dispatch actions triggered on a given node
      callAction(action, nodeId) {
        if (action === "edit") {
          this.showEditNode(nodeId);
        } else if (action === "view") {
          this.viewNode(nodeId);
        } else if (action === "delete") {
          this.confirmDeleteJob(nodeId);
        }
      },

      // trigger job type hint
      triggerHint(name) {
        this.typeHintName = name;
      },

      // refresh the map used to record the checked status of each version
      refreshCheckMap(curVer) {
        this.versionCheckMap = this.versions.reduce((acc, cur) => {
          acc[cur.id] = curVer === cur.id;

          return acc;
        }, {});
      },

      refreshLock() {
        this.refreshLockTimer = setTimeout(() => {
          APIService.put("refresh-editing-lock", {
            params: {
              flow_id: this.flowId
            }
          })
            .then(() => {
              // successfully updated the lock, prepare to do next pooling
              this.refreshLock();
            })
            .catch(({ message, type }) => {
              // service error
              if (type === "service") {
                // Generally we should close all active dialogs and let user
                // re-open the flow editing dialog, but based on current dialog
                // architecture there will be too many nested dialog instances
                // that are hard to trace and close one by one, especially
                // those anonymous "alert" and "confirm" dialogs, to solve
                // this, we simply reload current page to force user start
                // editing again.

                // status = -1: should refresh page to acquire a new lock
                // status = -2: some other one has acquired the lock, hence we
                // are forced to stop editing immediately
                alert(message);
                window.location.reload();
              } else {
                // if a network error occurs, continue refreshing the lock
                this.refreshLock();
              }
            });
        }, this.pollTimeout * 1000);
      },

      changeHoverNode(nodeId) {
        this.hoverNodeId = nodeId;
      },

      changeControlVisible(bool) {
        this.controlsVisible = bool;
      },

      changeTabs(tabName) {
        this.activeTabName = tabName;
      },

      // get available actions for each node
      // p.s.
      // 1. to add specific actions for some nodes, pass in
      //    the first argument as the node itself and calculate basing on it.
      // 2. to add `context menu(i.e. menu)` actions, the option should
      //    follow the definition of context-menu option items, for example,
      //    an extra `disabled` field can be used, also the `children` field
      //    can be used to define child menu items
      generateNodeActions(node) {
        let actions;

        if (this.mode === "edit") {
          actions = [
            {
              id: "edit",
              icon: "edit",
              // render the action as a shortcut
              type: "shortcut",
              title: `Edit "${node.name}"`
            },
            {
              id: "delete",
              icon: "times",
              // render the action as a shortcut
              type: "shortcut",
              title: `Delete "${node.name}"`
            }
          ];
        } else {
          actions = [
            {
              id: "view",
              icon: "eye",
              // render the action as a shortcut
              type: "shortcut",
              desc: `View details of "${node.name}"`
            }
          ];
        }

        return actions;
      },

      changeNodes(nodes) {
        this.nodes = nodes;
      },

      changeConns(conns) {
        this.conns = conns;
      },

      confirmDeleteJob(nodeId) {
        let node = this.getNodeById(nodeId);

        this.$confirm({
          dialogTitle: "Delete Job",
          dialogBody: `Are your sure you want to delete job "${node.name}"?`,

          okClicked: () => {
            this.$showLoading();

            APIService.delete("flow-job", {
              params: {
                flow_id: this.flowId,
                job_id: node.id
              }
            })
              .then(() => {
                this.changeNodes(
                  this.nodes.filter((item) => {
                    return item.id !== node.id;
                  })
                );

                // remove connections related to the node
                this.changeConns(
                  this.conns.filter((item) => {
                    return ![item.source, item.target].includes(node.id);
                  })
                );

                this.$showNotice("Job successfully deleted!");
              })
              .catch(({ message }) => {
                this.$alert(message);
              })
              .finally(() => {
                this.$hideLoading();
              });
          }
        });
      },

      changeFlowVersion(version) {
        this.$showLoading();

        APIService.get("flow-history", {
          params: {
            flow_id: this.flowId,
            history_id: version.id
          }
        })
          .then(({ data }) => {
            // for brand new version, remove the previous nodes which has
            // marks
            this.detachedNodes = [];
            this.circularConns = [];

            // for the absolutely new nodes, we need to set `uuid` for
            // each item immediately(for dealing with the endpoint
            // position bug) while for an existing node, please do not
            // update it's `uuid` since it will cause the jsplumb
            // drag-drop system to fail to work due to dom reference
            // mismatch issue.
            this.changeNodes(unifyNodeFormat(data.jobs, this.jobTypes));
            this.changeConns(data.conns);

            // note: should wrap up the update call into nextTick
            this.$nextTick(() => {
              this.$refs.canvas.setPan(0, 0);
              this.$refs.canvas.setZoom(1);
            });

            // refresh the checked state map, passing the curent version
            // as parameter
            this.refreshCheckMap(version.id);
            this.$showNotice(
              `Successfully switched flow version to "${version.message}"!`
            );
          })
          .catch(({ message }) => {
            this.$alert(message);
          })
          .finally(() => {
            this.$hideLoading();
          });
      },

      // create or edit node, "readonly" will not go into this function since
      // okClicked will not get triggered
      manageNode(node) {
        // create new node
        if (this.manageNodeMode === "create") {
          this.changeNodes([...this.nodes, refreshNodeUUID(node)]);
          this.$showNotice(`Job successfully created!`);
        } else if (this.manageNodeMode === "edit") {
          // else: edit existing node
          let updatedNodes = this.nodes.map((item) => {
            if (item.id === node.id) {
              item = Object.assign({}, item, node);
            }

            return item;
          });

          this.changeNodes(updatedNodes);
          this.$showNotice(`Job successfully updated!`);
        }

        // detach reference
        this.pendingNode = null;
      },

      viewNode(nodeId) {
        // should fetch job content before opening edit dialog
        this.$showLoading();

        // Note, this api is used for all flow jobs, by default it returns
        // email job, to mock other job types, pass in the mock flag as query
        // parameter to get it's corresponding response
        /*
        ,
        query: {
          __mock_job_type__: "python"
        }
        */
        APIService.get("flow-job", {
          params: {
            flow_id: this.flowId,
            job_id: nodeId
          }
        })
          .then(({ data }) => {
            // re-fill job content
            let nodes = this.nodes.map((item) => {
              if (item.id === nodeId) {
                item = Object.assign({}, item, {
                  content: data.content
                });
              }

              return item;
            });

            this.changeNodes(nodes);

            this.pendingNode = this.nodes.find((item) => {
              return item.id === nodeId;
            });
            this.manageNodeMode = "readonly";
            this.displayJobDialog = true;
          })
          .catch(({ message }) => {
            this.$alert(message);
          })
          .finally(() => {
            this.$hideLoading();
          });
      },

      showEditNode(nodeId) {
        // should fetch job content before opening edit dialog
        this.$showLoading();

        // Note, this api is used for all flow jobs, by default it returns
        // email job, to mock other job types, pass in the mock flag as query
        // parameter to get it's corresponding response
        /*
        ,
        query: {
          __mock_job_type__: "python"
        }
        */
        APIService.get("flow-job", {
          params: {
            flow_id: this.flowId,
            job_id: nodeId
          }
        })
          .then(({ data }) => {
            // re-fill job content
            let nodes = this.nodes.map((item) => {
              if (item.id === nodeId) {
                item = Object.assign({}, item, {
                  content: data.content
                });
              }

              return item;
            });

            this.changeNodes(nodes);

            this.pendingNode = this.nodes.find((item) => {
              return item.id === nodeId;
            });
            this.manageNodeMode = "edit";
            this.displayJobDialog = true;
          })
          .catch(({ message }) => {
            this.$alert(message);
          })
          .finally(() => {
            this.$hideLoading();
          });
      },

      // check flow format and return underlying errors
      checkFlow() {
        let error = null;
        let flowDesc = this.flowDesc.trim();
        let detached = [];
        let circular = [];
        let graph = new dagre.graphlib.Graph();

        for (let i = 0; i < this.conns.length; i++) {
          graph.setEdge(this.conns[i].source, this.conns[i].target);
          circular = dagre.graphlib.alg.findCycles(graph);
        }

        for (let i = 0; i < this.nodes.length; i++) {
          // append node to the graph
          graph.setNode(this.nodes[i].id);
        }

        detached = graph.sources().map((item) => {
          return parseInt(item);
        });

        // note that children of detached nodes are also counted as detached,
        // but due to the fact that the chart is not a standard parent-child
        // tree, we can't percisely mark those child nodes of a detached node
        // as also "detached", e.g. a child may be point back to it's parent
        // node and produce a circular
        detached = detached.filter((item) => {
          // not a "root" node but still has no incoming connections
          let node = this.nodes.find((subItem) => {
            return subItem.id === item;
          });

          return node.scope !== "root";
        });

        // first, do a round of basic check to avoid invalid flow format
        // before submitting
        // 1. flow must have a meanful description
        // 2. flow shouldn't include circles
        // 3. flow shouldn't include nodes detached from the tree
        if (flowDesc === "") {
          error = this.$_("Flow description can't be empty");
        } else if (circular.length > 0) {
          // only report the first circular(graphlib requires the edge endpoints
          // to be string, we should convert them back into numbers)
          let res = [];

          for (let i = circular[0].length - 1; i >= 0; i--) {
            res.push({
              source: parseInt(circular[0][i]),
              target: parseInt(
                circular[0][i === 0 ? circular[0].length - 1 : i - 1]
              )
            });
          }

          circular = res;
          error = this.$_("Circular references detected, please fix your flow design.");
        } else if (detached.length > 0) {
          error = this.$_("Flow should not include detached nodes");
        }

        return [
          error,
          // detached nodes
          detached,
          // circular references
          circular
        ];
      },

      // save flow changes to backend
      saveFlow({ desc, reDeploy }) {
        let flowDesc = this.flowDesc.trim();
        let conns = this.conns;

        // get current offset of the canvas, and add the offset to each
        // chart node so that the next time user opens the flow it's nodes
        // will remember their previous locations relative to the container
        // of the canvas instead of the canvas itself.
        let { canvasX, canvasY } = this.$refs.canvas.panzoom;

        // find out the latest axis of each node and save them together with
        // the flow.
        let axis = this.nodes.map((item) => {
          return {
            id: item.id,
            // add by the offset of the canvas
            x: item.left + canvasX,
            y: item.top + canvasY
          };
        });

        this.$showLoading();

        APIService.put("flow", {
          params: {
            flow_id: this.flowId
          },
          data: {
            conns,
            axis,
            // git commit message
            commit_msg: desc,
            // re-deploy or not
            is_redeploy: reDeploy,
            // pass around the original description, sometime later we'll
            // support editing description.
            description: flowDesc
          }
        })
          .then(() => {
            // among all those basic fields of a flow, up to now we only
            // support changing "description"
            this.$emit("okClicked", {
              flow_id: this.flowId,
              description: flowDesc,
              reDeploy
            });
            this.close();
          })
          .catch(({ message, type, error }) => {
            if (type === "service") {
              // status -3: node incorrectly pointed to root node.
              if (error.status === -2) {
                // else: detached nodes

                // detached nodes have been checked already, but to make sure
                // the checking result is right, double-check it here.
                this.detachedNodes = error.data;
                this.$alert(
                  this.$np_(
                    "flow canvas actions",
                    "Found a detached node",
                    "Found detached nodes",
                    this.detachedNodes.length
                  )
                );
              } else if (error.status === -4) {
                // else: circular references
                this.$alert(
                  "Circular references detected, please fix your flow design."
                );

                this.circularConns = error.data;
              } else {
                // else: other errors
                this.$alert(message);
              }
            } else {
              // else: network error
              this.$alert(message);
            }
          })
          .finally(() => {
            this.$hideLoading();
          });
      },

      // remove the instance
      close() {
        // for "edit" mode we need to stop the timer before close the dialog
        if (this.mode === "edit") {
          // cancel timer for refreshing editing lock
          this.refreshLockTimer && clearTimeout(this.refreshLockTimer);
          this.refreshLockTimer = null;

          // clear cached detached nodes and circular connections
          this.detachedNodes = [];
          this.circularConns = [];
        }

        // before closing the dialog, clear the filtering string in case
        // next time after the dialog is opened it's still there and affects
        // the available job amount.
        if (this.activeTabName === "graphTab") {
          this.$refs.flowNodeFilter.jobKeyword = "";
        }

        this.$emit("closeDialog");
      },

      cancelBtnClick() {
        this.$confirm({
          dialogTitle: this.$_("Discard Flow Changes"),
          dialogBody: this.$p_("confirm message", 'Are you sure you want to discard all changes made to '+
            'the ' +"flow?"),

          okClicked: () => {
            this.$showLoading();

            APIService.post("flow-cancel", {
              params: {
                flow_id: this.flowId
              }
            })
              .then(() => {
                this.$emit("cancelClicked");
                this.close();
              })
              .catch(({ message }) => {
                this.$alert(message);
              })
              .finally(() => {
                this.$hideLoading();
              });
          }
        });
      },

      // 点击保存按钮
      okBtnClick() {
        let [error, detached, circular] = this.checkFlow();

        this.detachedNodes = detached;
        this.circularConns = circular;

        if (error) {
          this.$alert(error);
        } else {
          // display save dialog
          this.displaySaveFlowDialog = true;
        }

        // closing process will be triggered by save flow dialog
      }
    }
  };
</script>

<style lang="scss">
  @import "~__libs/scss/lib-common-utils";

  .flow-dialog {
    .dialog__content {
      width: 100%;
      height: 100%;
    }

    .dialog__body {
      // 40px: header
      height: calc(100% - 40px);
      padding: 0;
    }

    // flow meta section
    &__flow {
      height: sz(50);
      padding: sz(5) sz(20);
      border-bottom: 1px solid map-get($colors, border-grey);

      &-info {
        float: left;

        &-name,
        &-desc {
          label {
            display: inline-block;
            width: sz(70);
          }
        }

        &-name {
          margin: 0;
          font-size: map-get($font-sizes, sm);
        }

        &-desc {
          margin: 0;
          font-size: map-get($font-sizes, xs);
          height: sz(26);
          line-height: sz(26);

          &-field {
            position: relative;
            vertical-align: middle;
            display: inline-block;
            height: 100%;

            &--edit {
              // visually hide the placeholder text
              color: map-get($colors, pure-white);
            }

            &-txt {
              display: inline-block;
              white-space: nowrap;
              min-width: sz(60);
              max-width: sz(400);
              overflow: hidden;
            }

            &-input {
              @include placeholder-color(
                map-get($colors, placeholder-text-color)
              );

              position: absolute;
              left: 0;
              top: 0;
              padding: 0;
              width: 100%;
              height: sz(26);
              border: 0;
              border-bottom: 1px solid map-get($colors, border-grey);
              padding: 0 sz(5);
              color: map-get($colors, pure-black);

              &::-ms-clear {
                display: none;
              }

              &:focus {
                border-color: map-get($colors, theme-blue);
              }
            }
          }

          &-edit,
          &-save {
            @include border-radius(50%);

            margin-left: sz(10);
            display: inline-block;
            width: sz(16);
            height: sz(16);
            line-height: sz(16);
            border: 1px solid;
            text-align: center;

            .icon {
              font-size: sz(10);
            }

            @at-root #{get-bem-root()} & {
              &:hover {
                color: map-get($colors, theme-blue);
              }
            }
          }
        }
      }

      // save btns
      &-actions {
        float: right;
        margin-top: sz((50 - 28) / 2);

        .btn {
          &:last-child {
            margin-left: sz(15);
          }
        }
      }
    }

    // editor body(use flex layout)
    &__editor {
      $_controls-width: 300;
      // total size(including border) of left panel that contains node types
      $_types-list-width: 141;

      display: flex;
      // because the child components don't shrink their sizes we should
      // make sure they don't overflow from the container
      overflow: hidden;
      // 61px: __info height + padding + border; 1px; bottom border
      height: calc(100% - 61px);

      &-types,
      &-canvas,
      .slide-out-panel {
        // these 3 components never shrink their own sizes automatically
        flex-shrink: 0;
        height: 100%;
      }

      // available node types
      &-types {
        @include border-radius(0 0 0 4px);

        // ensure the draggable nodes unable to cover up the sidebar
        // avoid the boxes from breaking through the container when the height
        // of the dialog is too small
        overflow-y: hidden;
        width: sz($_types-list-width - 1);
        height: 100%;
        border-right: 1px solid map-get($colors, border-grey);

        &-item {
          @include user-select(none);
          @include border-radius(4px);
          @extend %overflow-hidden-word;

          cursor: move;
          width: sz(90);
          // use the same size of the nodes that will be rendered in the
          // canvas, except width, since types are static
          height: sz(40);
          line-height: sz(40);
          margin: sz(10) auto;
          padding: 0 sz(10);
          // set background to avoid draggable node from becoming transparent.
          background: map-get($colors, pure-white);
          border: 1px solid map-get($colors, border-grey);

          // being moving around
          &--draggable {
            // make it displays above it's parent node.
            z-index: 1;
            // need to explicitly make it look like a movable element.
            cursor: move;
          }

          .icon {
            vertical-align: middle;
            font-size: sz(20);
          }
        }
      }

      // canvas wrapper
      &-canvas {
        @include transition(width 0.5s ease 0s);

        // used to hold the dotted hint box during capturing process
        position: relative;
        width: calc(100% - #{$_types-list-width}px);

        // very important, only display it while user is dragging around a
        // node, or the canvas will be covered by the pseudo element and
        // keep user from manipulating the nodes
        &::before {
          // add radius to get a better appearance coz some browsers like
          // chrome also add radius to its window
          @include border-radius(4px);

          display: none;
          content: "";
          position: absolute;
          // do not stick to the container too tightly
          left: 1px;
          top: 1px;
          // stay above the canvas;
          z-index: 1;
          // 4px for borders; 2px for offset
          width: calc(100% - 6px);
          height: calc(100% - 6px);
          border: 2px dashed rgba(map-get($colors, theme-blue), 0.7);
        }

        // user is dragging a new node around on the page（should not attach
        // it to `__graph` since it's position might change in panning and the
        // outline will not snap tightly to to the container border.
        &--capturing {
          &::before {
            display: block;
          }

          // highlight the virtual border once the node enters the hotspot
          &.jtk-drag-hover {
            &::before {
              border-color: map-get($colors, theme-blue);
            }
          }
        }

        // while slide out panel is expanded, we should shrink the size of
        // the canvas area
        &--expanded {
          width: calc(100% - #{$_types-list-width}px - #{$_controls-width}px);
        }
      }

      // control panel
      .slide-out-panel {
        width: sz($_controls-width);

        &__body {
          padding: 0;
          height: 100%;
        }

        // tabs
        .tabs {
          margin-top: sz(5);
          // 5px: margin
          height: calc(100% - 5px);

          &__contents {
            // 32px for header, 40px for top and bottom padding
            height: calc(100% - 32px - 40px);
          }

          &__content {
            height: 100%;

            .flow-node-filter,
            .flow-versions-table {
              height: 100%;
            }
          }
        }
      }

      // in "view" mode, hide the types panel and "switch version" panel
      @at-root #{get-bem-root()}#{get-bem-root()}--view & {
        &-types {
          display: none;
        }

        &-canvas {
          width: 100%;

          &--expanded {
            width: calc(100% - #{$_controls-width}px);
          }
        }
      }
    }

    // job type hint
    &__hint {
      &-name {
        font-weight: bold;
        color: map-get($colors, theme-blue);
      }
    }
  }
</style>
