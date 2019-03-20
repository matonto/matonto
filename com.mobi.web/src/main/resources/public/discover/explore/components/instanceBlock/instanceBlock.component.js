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
     * @name explore.component:instanceBlock
     * @requires $http
     * @requires $filter
     * @requires shared.service:discoverStateService
     * @requires discover.service:exploreService
     * @requires shared.service:utilService
     * @requires uuid
     *
     * @description
     * HTML contents in the instance block which shows the users the instances associated
     * with the class they have selected. They have a bread crumb trail to get back to early
     * pages and pagination controls at the bottom of the page.
     */
    const instanceBlockComponent = {
        templateUrl: 'discover/explore/components/instanceBlock/instanceBlock.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: instanceBlockComponentCtrl
    };
    instanceBlockComponent.$inject = ['$filter', 'discoverStateService', 'exploreService', 'utilService', 'uuid'];

    function instanceBlockComponentCtrl($filter, discoverStateService, exploreService, utilService, uuid) {
        var dvm = this;
        var es = exploreService;
        var util = utilService;
        dvm.ds = discoverStateService;

        dvm.setPage = function(page) {
            dvm.ds.explore.instanceDetails.currentPage = page;
            var pagingObj = {
                limit: dvm.ds.explore.instanceDetails.limit,
                offset: (dvm.ds.explore.instanceDetails.currentPage - 1) * dvm.ds.explore.instanceDetails.limit
            };
            es.getClassInstanceDetails(dvm.ds.explore.recordId, dvm.ds.explore.classId, pagingObj)
                .then(response => {
                    dvm.ds.explore.instanceDetails.data = [];
                    _.merge(dvm.ds.explore.instanceDetails, es.createPagedResultsObject(response));
                }, util.createErrorToast);
        }
        dvm.create = function() {
            dvm.ds.explore.creating = true;
            var split = $filter('splitIRI')(_.head(dvm.ds.explore.instanceDetails.data).instanceIRI);
            var iri = split.begin + split.then + uuid.v4();
            dvm.ds.explore.instance.entity = [{
                '@id': iri,
                '@type': [dvm.ds.explore.classId]
            }];
            dvm.ds.explore.instance.metadata.instanceIRI = iri;
            dvm.ds.explore.breadcrumbs.push('New Instance');
        }
        dvm.getClassName = function() {
            return _.last(dvm.ds.explore.breadcrumbs);
        }
    }

    angular.module('explore')
        .component('instanceBlock', instanceBlockComponent);
})();