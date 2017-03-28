/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

    angular
        .module('treeItem', [])
        .directive('treeItem', treeItem);

        treeItem.$inject = ['settingsManagerService', 'ontologyManagerService', 'ontologyStateService'];

        function treeItem(settingsManagerService, ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    hasChildren: '<',
                    isActive: '<',
                    isBold: '<',
                    onClick: '&'
                },
                bindToController: {
                    currentEntity: '=',
                    isOpened: '=',
                    path: '='
                },
                templateUrl: 'modules/ontology-editor/directives/treeItem/treeItem.html',
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();
                    var os = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.saved = isSaved();

                    dvm.getTreeDisplay = function() {
                        if (treeDisplay === 'pretty') {
                            return dvm.om.getEntityName(dvm.currentEntity, os.state.type);
                        }
                        return _.get(dvm.currentEntity, 'matonto.originalIRI', _.get(dvm.currentEntity, 'matonto.anonymous', ''));
                    }

                    dvm.toggleOpen = function() {
                        dvm.isOpened = !dvm.isOpened;
                        os.setOpened(dvm.path, dvm.isOpened);
                    }

                    function isSaved() {
                        var ids = _.unionWith(_.map(os.listItem.inProgressCommit.additions, '@id'), _.map(os.listItem.inProgressCommit.deletions, '@id'), _.isEqual);
                        return _.includes(ids, _.get(dvm.currentEntity, '@id'));
                    }

                    $scope.$watch(() => os.listItem.inProgressCommit, () => {
                        dvm.saved = isSaved();
                    });
                }]
            }
        }
})();
