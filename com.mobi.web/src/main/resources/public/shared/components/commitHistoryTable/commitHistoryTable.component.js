/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name shared.component:commitHistoryTable
     * @scope
     * @restrict E
     * @requires shared.service:catalogManagerService
     * @requires shared.service:utilService
     * @requires shared.service:userManagerService
     * @requires shared.service:modalService
     *
     * @description
     * `commitHistoryTable` is a directive that creates a table containing the commit chain of the provided commit.
     * Can optionally also display a SVG graph generated using Snap.svg showing the network of the commits along
     * with an optional title for the top commit. Clicking on a commit id or its corresponding circle in the graph
     * will open up a {@link shared.component:commitInfoOverlay commit info overlay}. Can optionally
     * provide a variable to bind the retrieved commits to. The directive is replaced by the content of the template.
     *
     * @param {string} commitId The IRI string of a commit in the local catalog
     * @param {string} headTitle The title to put on the top commit
     * @param {string} [targetId=''] targetId limits the commits displayed to only go as far back as this specified
     *      commit.
     * @param {Object[]} commitData A variable to bind the retrieved commits to
     * @param {Function} entityNameFunc An optional function to pass to `commitInfoOverlay` to control the display of
     * each entity's name
     */
    const commitHistoryTableComponent = {
        templateUrl: 'shared/components/commitHistoryTable/commitHistoryTable.component.html',
        transclude: true,
        bindings: {
            commitId: '<',
            headTitle: '<?',
            targetId: '<?',
            entityId: '<?',
            entityNameFunc: '<?',
            receiveCommits: '&?',
            graph: '@'
        },
        controllerAs: 'dvm',
        controller: commitHistoryTableComponentCtrl
    };

    commitHistoryTableComponentCtrl.$inject = ['httpService', 'catalogManagerService', 'utilService', 'userManagerService', 'modalService', 'Snap', 'chroma'];

    function commitHistoryTableComponentCtrl(httpService, catalogManagerService, utilService, userManagerService, modalService, Snap, chroma) {
        var dvm = this;
        var titleWidth = 75;
        var cm = catalogManagerService;
        var graphCommits = [];
        var cols = [];
        var wrapper;
        var xI = 1;
        var colorIdx = 0;
        
        dvm.util = utilService;
        dvm.um = userManagerService;
        dvm.snap = undefined;
        dvm.colors = [];

        dvm.error = '';
        dvm.commit = undefined;
        dvm.additions = [];
        dvm.deletions = [];
        dvm.commits = [];
        dvm.circleRadius = 5;
        dvm.circleSpacing = 48;
        dvm.columnSpacing = 25;
        dvm.deltaX = 5 + dvm.circleRadius;
        dvm.deltaY = 56;
        dvm.id = 'commit-history-table';

        dvm.$onInit = function() {
            dvm.showGraph = dvm.graph !== undefined;
            dvm.colors = chroma.brewer.Set1;
            dvm.snap = Snap('.commit-graph');
        }
        dvm.$onChanges = function(changesObj) {
            if (_.has(changesObj, 'headTitle') || _.has(changesObj, 'commitId') || _.has(changesObj, 'targetId') || _.has(changesObj, 'entityId')) {
                dvm.getCommits();
            }
        }
        dvm.$onDestroy = function() {
            httpService.cancel(dvm.id);
        }
        dvm.openCommitOverlay = function(commitId) {
            cm.getCommit(commitId)
                .then(response => {
                    modalService.openModal('commitInfoOverlay', {
                        commit: _.find(dvm.commits, {id: commitId}),
                        additions: response.additions,
                        deletions: response.deletions,
                        entityNameFunc: dvm.entityNameFunc
                    }, undefined, 'lg');
                }, errorMessage => dvm.error = errorMessage);
        }
        dvm.getCommits = function() {
            if (dvm.commitId) {
                httpService.cancel(dvm.id);
                var promise = cm.getCommitHistory(dvm.commitId, dvm.targetId, dvm.entityId, dvm.id);
                promise.then(commits => {
                    if (dvm.receiveCommits) {
                        dvm.receiveCommits({commits});
                    }
                    dvm.commits = commits;
                    dvm.error = '';
                    if (dvm.showGraph) {
                        dvm.drawGraph();
                    }
                }, errorMessage => {
                    dvm.error = errorMessage;
                    dvm.commits = [];
                    if (dvm.receiveCommits) {
                        dvm.receiveCommits({commits: []});
                    }
                    if (dvm.showGraph) {
                        dvm.reset();
                    }
                });
            } else {
                dvm.commits = [];
                if (dvm.receiveCommits) {
                    dvm.receiveCommits({commits: []});
                }
                if (dvm.showGraph) {
                    dvm.reset();
                }
            }
        }
        dvm.drawGraph = function() {
            dvm.reset();
            if (dvm.commits.length > 0) {
                wrapper = dvm.snap.group();
                // First draw circles in a straight line
                _.forEach(dvm.commits, (commit, i) => {
                    var circle = dvm.snap.circle(0, dvm.circleSpacing/2 + (i * dvm.circleSpacing), dvm.circleRadius);
                    var title = Snap.parse('<title>' + dvm.util.condenseCommitId(commit.id) + '</title>')
                    circle.append(title);
                    circle.click(() => dvm.openCommitOverlay(commit.id));
                    wrapper.add(circle);
                    graphCommits.push({commit: commit, circle: circle});
                });
                // Set up head commit and begin recursion
                var c = graphCommits[0];
                var color = dvm.colors[colorIdx % dvm.colors.length];
                colorIdx++;
                c.circle.attr({fill: color});
                cols.push({x: 0, commits: [c.commit.id], color: color});
                if (dvm.headTitle) {
                    drawHeadTitle(c.circle);
                }
                recurse(c);
                // Update deltaX based on how many columns there are or the minimum width
                dvm.deltaX = _.max([dvm.deltaX + xI * dvm.columnSpacing, titleWidth + 10 + dvm.circleRadius]);
                // Shift the x and y coordinates of everything using deltaX and deltaY
                _.forEach(graphCommits, (c, idx) => c.circle.attr({cx: c.circle.asPX('cx') + dvm.deltaX, cy: c.circle.asPX('cy') + dvm.deltaY}));
                _.forEach(wrapper.selectAll('path'), path => {
                    var points = _.map(_.split(path.attr('d'), ' '), s => {
                        var sections;
                        var head;
                        if (_.startsWith(s, 'M') || _.startsWith(s, 'C') || _.startsWith(s, 'L')) {
                            head = _.head(s);
                            sections = _.split(s.substring(1), ',');
                        } else {
                            head = '';
                            sections = _.split(s, ',');
                        }
                        sections[0] = '' + (parseFloat(sections[0], 10) + dvm.deltaX);
                        sections[1] = '' + (parseFloat(sections[1], 10) + dvm.deltaY);
                        return head + _.join(sections, ',');
                    });
                    path.attr({d: _.join(points, ' ')});
                });
                _.forEach(wrapper.selectAll('rect'), rect => rect.attr({x: rect.asPX('x') + dvm.deltaX, y: rect.asPX('y') + dvm.deltaY}));
                _.forEach(wrapper.selectAll('text'), text => text.attr({x: text.asPX('x') + dvm.deltaX, y: text.asPX('y') + dvm.deltaY}));
            }
        }
        dvm.reset = function() {
            graphCommits = [];
            cols = [];
            xI = 1;
            colorIdx = 0;
            dvm.snap.clear();
            dvm.snap = Snap('.commit-graph');
            wrapper = undefined;
            dvm.deltaX = 5 + dvm.circleRadius;
        }

        function recurse(c) {
            // Find the column this commit belongs to and the ids of its base and auxiliary commits
            var col = _.find(cols, col => _.includes(col.commits, c.commit.id));
            var baseParent = c.commit.base;
            var auxParent = c.commit.auxiliary;
            // If there is an auxiliary parent, there is also a base parent
            if (auxParent) {
                // Determine whether the base parent is already in a column
                var baseC = _.find(graphCommits, {commit: {id: baseParent}});
                var baseCol = _.find(cols, col => _.includes(col.commits, baseParent));
                var baseColor = col.color;
                if (!baseCol) {
                    // If not in a column, shift the base parent to be beneath the commit
                    baseC.circle.attr({cx: col.x, fill: col.color});
                    col.commits.push(baseParent);
                }
                // Draw a line between commit and base parent
                drawLine(c, baseC, col.color);
                // Determine whether auxiliary parent is already in a column
                var auxC = _.find(graphCommits, {commit: {id: auxParent}});
                var auxCol = _.find(cols, col => _.includes(col.commits, auxParent));
                var auxColor;
                if (auxCol) {
                    // If in a column, collect line color
                    auxColor = auxCol.color;
                } else {
                    // If not in a column, shift the auxiliary parent to the left in new column and collect line color
                    auxColor = dvm.colors[colorIdx % dvm.colors.length];
                    colorIdx++;
                    auxC.circle.attr({cx: -dvm.columnSpacing * xI, fill: auxColor});
                    cols.push({x: -dvm.columnSpacing * xI, commits: [auxParent], color: auxColor});
                    xI++;
                }
                // Draw a line between commit and auxiliary parent
                drawLine(c, auxC, auxColor);
                // Recurse on right only if it wasn't in a column to begin with
                if (!baseCol) {
                    recurse(baseC);
                }
                // Recurse on left only if it wasn't in a column to begin with
                if (!auxCol) {
                    recurse(auxC);
                }
            } else if (baseParent) {
                // Determine whether the base parent is already in a column
                var baseC = _.find(graphCommits, {commit: {id: baseParent}});
                var baseCol = _.find(cols, col => _.includes(col.commits, baseParent));
                if (!baseCol) {
                    // If not in a column, push into current column and draw a line between them
                    baseC.circle.attr({cx: col.x, fill: col.color});
                    col.commits.push(baseParent);
                    drawLine(c, baseC, col.color);
                    // Continue recursion
                    recurse(baseC);
                } else {
                    // If in a column, draw a line between them and end this branch of recusion
                    drawLine(c, baseC, col.color);
                }
            }
        }
        function drawLine(c, parentC, color) {
            var start = {x: c.circle.asPX('cx'), y: c.circle.asPX('cy')};
            var end = {x: parentC.circle.asPX('cx'), y: parentC.circle.asPX('cy')};
            var pathStr = 'M' + start.x + ',' + (start.y + dvm.circleRadius);
            if (start.x > end.x) {
                // If the starting commit is further right than the ending commit, curve first then go straight down
                pathStr += ' C' + start.x + ',' + (start.y + 3 * dvm.circleSpacing/4) + ' ' + end.x + ',' + (start.y + dvm.circleSpacing/4) + ' '
                    + end.x + ',' + (_.min([start.y + dvm.circleSpacing, end.y - dvm.circleRadius])) + ' L';
            } else if (start.x < end.x) {
                // If the starting commit is further left than the ending commmit, check if there are any commits in between in the same column
                // as the starting commit
                var inBetweenCommits = graphCommits.slice(_.indexOf(graphCommits, c) + 1, _.indexOf(graphCommits, parentC));
                if (_.find(inBetweenCommits, commit => commit.circle.asPX('cx') === start.x)) {
                    // If there is a commit in the way, curve first then go straight down
                    pathStr += ' C' + start.x + ',' + (start.y + 3 * dvm.circleSpacing/4) + ' ' + end.x + ',' + (start.y + dvm.circleSpacing/4) + ' '
                        + end.x + ',' + (start.y + dvm.circleSpacing) + ' L';
                } else {
                    // If there isn't a commit in the way, go straight down then curve
                    pathStr += ' L' + start.x + ',' + (_.max([end.y - dvm.circleSpacing, start.y + dvm.circleRadius])) + ' C' + start.x + ',' + (end.y - dvm.circleSpacing/4) + ' '
                        + end.x + ',' + (end.y - 3 * dvm.circleSpacing/4) + ' ';
                }
            } else {
                // If the starting and ending commits are in the same column, go straight down
                pathStr += ' L';
            }
            pathStr += end.x + ',' + (end.y - dvm.circleRadius);
            var path = dvm.snap.path(pathStr);
            path.attr({
                fill: 'none',
                'stroke-width': 2,
                stroke: color
            });
            wrapper.add(path);
        }
        function drawHeadTitle(circle) {
            var cx = circle.asPX('cx'),
                cy = circle.asPX('cy'),
                r = circle.asPX('r');
            var rect = dvm.snap.rect(cx - r - titleWidth - 5, cy - r - 5, titleWidth, 20, 5, 5);
            rect.attr({
                'fill-opacity': '0.5'
            });
            var triangle = dvm.snap.path('M' + (cx - r - 5) + ',' + (cy - r) + ' L' + (cx - r) + ',' + cy + ' L' + (cx - r - 5) + ',' + (cy + r));
            triangle.attr({
                'fill-opacity': '0.5'
            });
            var displayText = dvm.headTitle;
            var title = Snap.parse('<title>' + displayText + '</title>');
            var text = dvm.snap.text(rect.asPX('x') + (rect.asPX('width'))/2, rect.asPX('y') + (rect.asPX('height')/2), displayText);
            text.attr({
                'text-anchor': 'middle',
                'alignment-baseline': 'central',
                fill: '#fff'
            });
            while (text.getBBox().width > rect.asPX('width') - 5) {
                displayText = displayText.slice(0, -1);
                text.node.innerHTML = displayText + '...';
            }
            text.append(title);
            wrapper.add(rect, triangle, text);
        }
    }

    angular.module('shared')
        .component('commitHistoryTable', commitHistoryTableComponent);
})();
