/*-
 * #%L
 * com.mobi.web
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
        /**
         * @ngdoc overview
         * @name conceptSchemeHierarchyBlock
         *
         * @description
         * The `conceptSchemeHierarchyBlock` module only provides the `conceptSchemeHierarchyBlock` directive which
         * creates a section for displaying the concepts and concept schemes in an ontology/vocabulary.
         */
        .module('conceptSchemeHierarchyBlock', [])
        /**
         * @ngdoc directive
         * @name conceptSchemeHierarchyBlock.directive:conceptSchemeHierarchyBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires modal.service:modalService
         *
         * @description
         * `conceptSchemeHierarchyBlock` is a directive that creates a section that displays a
         * {@link hierarchyTree.directive:hierarchyTree} of the concept schemes and concepts in the current
         * {@link ontologyState.service:ontologyStateService selected ontology/vocabulary} along with a button to add
         * concept schemes. The directive houses the method for opening a modal for
         * {@link createConceptSchemeOverlay.directive:createConceptSchemeOverlay adding concept schemes}. The
         * directive is replaced by the contents of its template.
         */
        .directive('conceptSchemeHierarchyBlock', conceptSchemeHierarchyBlock);

        conceptSchemeHierarchyBlock.$inject = ['ontologyStateService', 'modalService'];

        function conceptSchemeHierarchyBlock(ontologyStateService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/conceptSchemeHierarchyBlock/conceptSchemeHierarchyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.os = ontologyStateService;

                    dvm.showCreateConceptSchemeOverlay = function() {
                        dvm.os.unSelectItem();
                        modalService.openModal('createConceptSchemeOverlay');
                    }
                }
            }
        }
})();
