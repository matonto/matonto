/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
        .module('propertyValueOverlay', [])
        .directive('propertyValueOverlay', propertyValueOverlay);
        
        propertyValueOverlay.$inject = ['discoverStateService', 'prefixes', 'uuid', 'utilService', 'exploreUtilsService'];
        
        function propertyValueOverlay(discoverStateService, prefixes, uuid, utilService, exploreUtilsService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/propertyValueOverlay/propertyValueOverlay.html',
                replace: true,
                scope: {
                    text: '<'
                },
                bindToController: {
                    closeOverlay: '&',
                    index: '<',
                    iri: '<',
                    onSubmit: '&',
                    properties: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ds = discoverStateService;
                    dvm.eu = exploreUtilsService;
                    dvm.util = utilService;
                    dvm.propertyText = '';
                    
                    var instance = ds.getInstance();
                    var subject = [{'@id': instance['@id']}];
                    var predicate = [{'@id': dvm.iri}];
                    var object = [angular.copy(_.get(_.get(instance, dvm.iri, []), dvm.index))];
                    var ommitted = ['@id', '@type', prefixes.rdf + 'subject', prefixes.rdf + 'predicate', prefixes.rdf + 'object'];
                    
                    dvm.reification = _.find(ds.explore.instance.entity, thing => {
                        return _.includes(_.get(thing, '@type', []), prefixes.rdf + 'Statement')
                            && _.isEqual(get(thing, 'subject'), subject)
                            && _.isEqual(get(thing, 'predicate'), predicate)
                            && _.isEqual(get(thing, 'object'), object);
                    }) || {
                        '@id': '_:matonto/bnode/' + uuid.v4(),
                        '@type': [prefixes.rdf + 'Statement'],
                        [prefixes.rdf + 'subject']: subject,
                        [prefixes.rdf + 'predicate']: predicate,
                        [prefixes.rdf + 'object']: object
                    };
                    
                    dvm.addNewProperty = function(property) {
                        dvm.reification[property] = [];
                        dvm.addToChanged(property);
                        dvm.showOverlay = false;
                    }
                    
                    dvm.notOmmitted = function(propertyIRI) {
                        return !_.includes(ommitted, propertyIRI);
                    }
                    
                    dvm.submit = function() {
                        _.forOwn(dvm.reification, (value, key) => {
                            if (_.isArray(value) && value.length === 0) {
                                delete dvm.reification[key];
                            }
                        });
                        if (_.some(ds.explore.instance.entity, {'@id': dvm.reification['@id']})) {
                            var index = _.findIndex(ds.explore.instance.entity, {'@id': dvm.reification['@id']});
                            ds.explore.instance.entity[index] = dvm.reification;
                        } else {
                            ds.explore.instance.entity.push(dvm.reification);
                        }
                        dvm.onSubmit();
                        dvm.closeOverlay();
                    }
                    
                    dvm.addToChanged = function(propertyIRI) {
                        dvm.changed = _.uniq(_.concat(dvm.changed, [propertyIRI]));
                    }
                    
                    dvm.isChanged = function(propertyIRI) {
                        return _.includes(dvm.changed, propertyIRI);
                    }
                    
                    function get(thing, localName) {
                        return _.get(thing, prefixes.rdf + localName, {});
                    }
                }
            }
        }
})();