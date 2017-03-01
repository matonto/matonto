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
        .module('ontologyState', [])
        .service('ontologyStateService', ontologyStateService);

        ontologyStateService.$inject = ['$timeout', '$q', 'ontologyManagerService', 'updateRefsService',
            'stateManagerService', 'utilService', 'catalogManagerService'];

        function ontologyStateService($timeout, $q, ontologyManagerService, updateRefsService,
            stateManagerService, utilService, catalogManagerService) {
            var self = this;
            var om = ontologyManagerService;
            var sm = stateManagerService;
            var cm = catalogManagerService;
            var util = utilService;

            self.states = [];
            self.newState = {active: true};
            self.state = self.newState;
            self.selected = {};
            self.listItem = {};

            self.reset = function() {
                self.states = [];
                self.selected = {};
                self.state = self.newState;
                self.state.active = true;
                self.listItem = {};
            }
            self.afterSave = function() {
                var deferred = $q.defer();
                cm.getInProgressCommit(self.listItem.recordId, _.get(cm.localCatalog, '@id', ''))
                    .then(inProgressCommit => {
                        self.listItem.inProgressCommit = inProgressCommit;

                        self.listItem.additions = [];
                        self.listItem.deletions = [];

                        _.forOwn(self.state, (value, key) => {
                            _.unset(value, 'usages');
                        });

                        if (_.isEmpty(sm.getOntologyStateByRecordId(self.listItem.recordId))) {
                            return sm.createOntologyState(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId);
                        } else {
                            return sm.updateOntologyState(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId);
                        }
                    }, $q.reject)
                    .then(deferred.resolve, deferred.reject);
                return deferred.promise;
            }
            self.clearInProgressCommit = function() {
                _.set(self.listItem, 'inProgressCommit.additions', []);
                _.set(self.listItem, 'inProgressCommit.deletions', []);
            }
            self.setOpened = function(pathString, isOpened) {
                _.set(self.state, encodeURIComponent(pathString) + '.isOpened', isOpened);
            }
            self.getOpened = function(pathString) {
                return _.get(self.state, encodeURIComponent(pathString) + '.isOpened', false);
            }
            self.setNoDomainsOpened = function(recordId, isOpened) {
                _.set(self.state, encodeURIComponent(recordId) + '.noDomainsOpened', isOpened);
            }
            self.getNoDomainsOpened = function(recordId) {
                return _.get(self.state, encodeURIComponent(recordId) + '.noDomainsOpened', false);
            }
            self.setIndividualsOpened = function(recordId, classIRI, isOpened) {
                _.set(self.state, getOpenPath(recordId, classIRI) + '.individualsOpened', isOpened);
            }
            self.getIndividualsOpened = function(recordId, classIRI) {
                return _.get(self.state, getOpenPath(recordId, classIRI) + '.individualsOpened', false);
            }
            self.setDataPropertiesOpened = function(recordId, isOpened) {
                _.set(self.state, encodeURIComponent(recordId) + '.dataPropertiesOpened', isOpened);
            }
            self.getDataPropertiesOpened = function(recordId) {
                return _.get(self.state, encodeURIComponent(recordId) + '.dataPropertiesOpened', false);
            }
            self.setObjectPropertiesOpened = function(recordId, isOpened) {
                _.set(self.state, encodeURIComponent(recordId) + '.objectPropertiesOpened', isOpened);
            }
            self.getObjectPropertiesOpened = function(recordId) {
                return _.get(self.state, encodeURIComponent(recordId) + '.objectPropertiesOpened', false);
            }
            self.onEdit = function(iriBegin, iriThen, iriEnd) {
                var newIRI = iriBegin + iriThen + iriEnd;
                var oldEntity = angular.copy(self.selected);
                updateRefsService.update(self.listItem, self.selected['@id'], newIRI);
                self.getActivePage().entityIRI = newIRI;
                om.addToAdditions(self.listItem.recordId, angular.copy(self.selected));
                om.addToDeletions(self.listItem.recordId, oldEntity);
                om.getEntityUsages(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId, oldEntity['@id'], 'construct')
                    .then(statements => {
                        _.forEach(statements, statement => om.addToDeletions(self.listItem.recordId, statement));
                        updateRefsService.update(statements, oldEntity['@id'], newIRI);
                        _.forEach(statements, statement => om.addToAdditions(self.listItem.recordId, statement));
                    }, errorMessage => util.createErrorToast('Associated entities were not updated due to an internal error.'));
            }
            self.setSelected = function(entityIRI, getUsages = true) {
                self.selected = om.getEntityByRecordId(self.listItem.recordId, entityIRI);
                if (getUsages && !_.has(self.getActivePage(), 'usages') && self.selected) {
                    self.setEntityUsages(entityIRI);
                }
            }
            self.setEntityUsages = function(entityIRI) {
                om.getEntityUsages(self.listItem.recordId, self.listItem.branchId, self.listItem.commitId, entityIRI)
                    .then(bindings => _.set(self.getActivePage(), 'usages', bindings),
                        response => _.set(self.getActivePage(), 'usages', []));
            }
            self.addState = function(recordId, entityIRI, type) {
                var tabs = {};
                var newState = {
                    recordId,
                    active: false,
                    type
                }
                if (type === 'ontology') {
                    tabs = {
                        project: {
                            active: true,
                            entityIRI: entityIRI
                        },
                        overview: {
                            active: false
                        },
                        classes: {
                            active: false
                        },
                        properties: {
                            active: false
                        },
                        individuals: {
                            active: false
                        },
                        search: {
                            active: false
                        }
                    }
                } else if (type === 'vocabulary') {
                    tabs = {
                        project: {
                            active: true,
                            entityIRI: entityIRI
                        },
                        concepts: {
                            active: false
                        },
                        search: {
                            active: false
                        }
                    }
                }
                _.merge(newState, tabs);
                self.states.push(newState);
            }
            self.setState = function(recordId, getUsages = false) {
                self.state.active = false;
                if (!recordId) {
                    self.state = self.newState;
                } else {
                    self.state = _.find(self.states, {recordId});
                    self.listItem = om.getListItemByRecordId(recordId);
                    self.setSelected(self.getActiveEntityIRI(), getUsages);
                }
                self.state.active = true;
            }
            self.getState = function(recordId) {
                return recordId ? _.find(self.states, {recordId}) : self.newState;
            }
            self.deleteState = function(recordId) {
                if (self.state.recordId === recordId) {
                    self.state = self.newState;
                    self.state.active = true;
                    self.selected = undefined;
                }
                _.remove(self.states, {recordId});
            }
            self.resetStateTabs = function() {
                _.forOwn(self.state, (value, key) => {
                    if (key !== 'project') {
                        _.unset(value, 'entityIRI');
                    }
                    _.unset(value, 'usages');
                });
                if (self.getActiveKey() !== 'project') {
                    self.selected = undefined;
                }
            }
            self.getActiveKey = function() {
                return _.findKey(self.state, ['active', true]) || 'project';
            }
            self.getActivePage = function() {
                return self.state[self.getActiveKey()];
            }
            self.setActivePage = function(key) {
                if (_.has(self.state, key)) {
                    self.getActivePage().active = false;
                    self.state[key].active = true;
                }
            }
            self.getActiveEntityIRI = function() {
                return _.get(self.getActivePage(), 'entityIRI');
            }
            self.selectItem = function(entityIRI, getUsages = true) {
                if (entityIRI && entityIRI !== self.getActiveEntityIRI()) {
                    _.set(self.getActivePage(), 'entityIRI', entityIRI);
                    if (getUsages) {
                        self.setEntityUsages(entityIRI);
                    }
                }
                self.setSelected(entityIRI, false);
            }
            self.unSelectItem = function() {
                var activePage = self.getActivePage();
                _.unset(activePage, 'entityIRI');
                _.unset(activePage, 'usages');
                self.selected = undefined;
            }
            self.hasChanges = function(recordId) {
                var listItem = om.getListItemByRecordId(recordId);
                return !!_.get(listItem, 'additions', []).length || !!_.get(listItem, 'deletions', []).length;
            }
            self.isCommittable = function(recordId) {
                var listItem = om.getListItemByRecordId(recordId);
                return !!_.get(listItem, 'inProgressCommit.additions', []).length || !!_.get(listItem, 'inProgressCommit.deletions', []).length;
            }
            self.addEntityToHierarchy = function(hierarchy, entityIRI, indexObject, parentIRI) {
                var hierarchyItem = {entityIRI};
                var pathsToEntity = self.getPathsTo(indexObject, entityIRI);
                if (pathsToEntity.length) {
                    if (pathsToEntity[0].length > 1) {
                        var path = pathsToEntity[0];
                        hierarchyItem = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 0) {
                            hierarchyItem = _.find(hierarchyItem.subEntities, {entityIRI: path.shift()});
                        }
                    } else if (_.some(hierarchy, {entityIRI})) {
                        hierarchyItem = _.remove(hierarchy, hierarchyItem)[0];
                    }
                }
                if (parentIRI) {
                    _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent =>
                        parent.subEntities = _.union(_.get(parent, 'subEntities', []), [hierarchyItem]));
                } else {
                    hierarchy.push(hierarchyItem);
                }
                indexObject[entityIRI] = _.union(_.get(indexObject, entityIRI, []), [parentIRI]);
            }
            self.deleteEntityFromParentInHierarchy = function(hierarchy, entityIRI, parentIRI, indexObject) {
                var deletedEntity;
                _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent => {
                    if (_.has(parent, 'subEntities')) {
                        deletedEntity = _.remove(parent.subEntities, {entityIRI})[0];
                        if (!parent.subEntities.length) {
                            _.unset(parent, 'subEntities');
                        }
                    }
                });
                if (_.has(indexObject, entityIRI)) {
                    _.remove(indexObject[entityIRI], item => item === parentIRI);
                    if (!indexObject[entityIRI].length) {
                        _.unset(indexObject, entityIRI);
                        hierarchy.push(deletedEntity);
                    }
                }
            }
            self.deleteEntityFromHierarchy = function(hierarchy, entityIRI, indexObject) {
                var deletedEntity;
                var paths = self.getPathsTo(indexObject, entityIRI);
                _.forEach(paths, path => {
                    if (path.length === 1) {
                        deletedEntity = _.remove(hierarchy, {entityIRI: path.shift()})[0];
                    } else if (path.length > 1) {
                        var current = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 1) {
                            current = _.find(current.subEntities, {entityIRI: path.shift()});
                        }
                        deletedEntity = _.remove(current.subEntities, {entityIRI: path.shift()})[0];
                        if (!current.subEntities.length) {
                            _.unset(current, 'subEntities');
                        }
                    }
                });
                _.unset(indexObject, entityIRI);
                updateRefsService.remove(indexObject, entityIRI);
                _.forEach(_.get(deletedEntity, 'subEntities', []), hierarchyItem => {
                    var paths = self.getPathsTo(indexObject, hierarchyItem.entityIRI);
                    if (paths.length === 1 && paths[0].length === 1) {
                        hierarchy.push(hierarchyItem);
                        _.unset(indexObject, hierarchyItem.entityIRI);
                    }
                });
            }
            self.getPathsTo = function(indexObject, entityIRI) {
                var result = [];
                if (_.has(indexObject, entityIRI)) {
                    _.forEach(indexObject[entityIRI], parentIRI => {
                        var paths = self.getPathsTo(indexObject, parentIRI);
                        _.forEach(paths, path => {
                            path.push(entityIRI);
                            result.push(path);
                        });
                    });
                } else {
                    result.push([entityIRI]);
                }
                return result;
            }
            self.goTo = function(iri) {
                var entity = om.getEntityByRecordId(self.listItem.recordId, iri);
                if (self.state.type === 'vocabulary') {
                    commonGoTo('concepts', iri, 'conceptIndex');
                } else if (om.isClass(entity)) {
                    commonGoTo('classes', iri, 'classIndex');
                } else if (om.isDataTypeProperty(entity)) {
                    commonGoTo('properties', iri, 'dataPropertyIndex');
                    self.setDataPropertiesOpened(self.listItem.recordId, true);
                } else if (om.isObjectProperty(entity)) {
                    commonGoTo('properties', iri, 'objectPropertyIndex');
                    self.setObjectPropertiesOpened(self.listItem.recordId, true);
                } else if (om.isIndividual(entity)) {
                    commonGoTo('individuals', iri);
                } else if (om.isOntology(entity)) {
                    commonGoTo('project', iri);
                }
            }
            self.openAt = function(pathsArray) {
                var selectedPath = _.find(pathsArray, path => {
                    var pathString = self.listItem.recordId;
                    return _.every(_.initial(path), pathPart => {
                        pathString += '.' + pathPart;
                        return self.getOpened(pathString);
                    });
                });
                if (!selectedPath) {
                    selectedPath = _.head(pathsArray);
                    var pathString = self.listItem.recordId;
                    _.forEach(_.initial(selectedPath), pathPart => {
                        pathString += '.' + pathPart;
                        self.setOpened(pathString, true);
                    });
                }
                $timeout(function() {
                    var $element = document.querySelectorAll('[data-path-to="' + self.listItem.recordId + '.'
                        + _.join(selectedPath, '.') + '"]');
                    var $hierarchyBlock = document.querySelectorAll('[class*=hierarchy-block] .block-content');
                    if ($element.length && $hierarchyBlock.length) {
                        $hierarchyBlock[0].scrollTop = $element[0].offsetTop;
                    }
                });
            }
            function getEntities(hierarchy, entityIRI, indexObject) {
                var results = [];
                var pathsToEntity = self.getPathsTo(indexObject, entityIRI);
                _.forEach(pathsToEntity, path => {
                    var entity = _.find(hierarchy, {entityIRI: path.shift()});
                    while (path.length > 0) {
                        entity = _.find(entity.subEntities, {entityIRI: path.shift()});
                    }
                    results.push(entity);
                });
                return results;
            }
            function commonGoTo(key, iri, index) {
                self.setActivePage(key);
                self.selectItem(iri);
                if (index) {
                    self.openAt(self.getPathsTo(self.listItem[index], iri));
                }
            }
            function getOpenPath() {
                return _.join(_.map([...arguments], encodeURIComponent), '.');
            }
        }
})();