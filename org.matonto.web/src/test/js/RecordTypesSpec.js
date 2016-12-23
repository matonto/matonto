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
describe('Records Type directive', function() {
    var $compile,
        scope,
        catalogManagerSvc,
        inArrayFilter,
        controller;

    beforeEach(function() {
        module('templates');
        module('recordTypes');
        mockCatalogManager();
        injectInArrayFilter();

        inject(function(_catalogManagerService_, _inArrayFilter_, _$compile_, _$rootScope_) {
            catalogManagerSvc = _catalogManagerService_;
            inArrayFilter = _inArrayFilter_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.record = {};
            this.element = $compile(angular.element('<record-types record="record"></record-types>'))(scope);
            scope.$digest();
        });
        it('record should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.record = {'@type': []};
            scope.$digest();
            expect(scope.record).toEqual({});
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.record = {'@type': []};
            this.element = $compile(angular.element('<record-types record="record"></record-types>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('record-types')).toBe(true);
        });
        it('depending on how many types the record has', function() {
            scope.record['@type'] = ['type0'];
            scope.$digest();
            expect(inArrayFilter).toHaveBeenCalledWith(scope.record['@type'], catalogManagerSvc.recordTypes);
            expect(this.element.find('record-type').length).toBe(scope.record['@type'].length);
        });
    });
});