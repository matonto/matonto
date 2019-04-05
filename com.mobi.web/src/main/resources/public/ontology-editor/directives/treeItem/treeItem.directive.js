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

    angular
        .module('treeItem', [])
        .directive('treeItem', treeItem);

        treeItem.$inject = ['settingsManagerService', 'ontologyStateService'];

        function treeItem(settingsManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                bindToController: {
                    hasChildren: '<',
                    isActive: '<',
                    isBold: '<',
                    onClick: '&',
                    currentEntity: '<',
                    isOpened: '<',
                    path: '<',
                    underline: '<',
                    toggleOpen: '&'
                },
                templateUrl: 'ontology-editor/directives/treeItem/treeItem.directive.html',
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var treeDisplay = settingsManagerService.getTreeDisplay();
                    var os = ontologyStateService;
                    dvm.treeDisplay = '';

                    dvm.$onInit = function() {
                        dvm.saved = dvm.isSaved();
                        dvm.treeDisplay = dvm.getTreeDisplay();
                    }
                    dvm.$onChanges = function() {
                        dvm.saved = dvm.isSaved();
                        dvm.treeDisplay = dvm.getTreeDisplay();
                    }
                    dvm.getTreeDisplay = function() {
                        if (treeDisplay === 'pretty') {
                            return os.getEntityNameByIndex(_.get(dvm.currentEntity, '@id'), os.listItem);
                        }
                        return _.get(dvm.currentEntity, 'mobi.anonymous', '');
                    }
                    dvm.isSaved = function() {
                        var ids = _.unionWith(_.map(os.listItem.inProgressCommit.additions, '@id'), _.map(os.listItem.inProgressCommit.deletions, '@id'), _.isEqual);
                        return _.includes(ids, _.get(dvm.currentEntity, '@id'));
                    }

                    $scope.$watch(() => os.listItem.inProgressCommit.additions + os.listItem.inProgressCommit.deletions, () => dvm.saved = dvm.isSaved());
                }]
            }
        }
})();
