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
describe('Class Block directive', function() {
    var $compile, scope, element, discoverStateSvc, controller;

    beforeEach(function() {
        module('templates');
        module('classBlock');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });
        
        element = $compile(angular.element('<class-block></class-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('class-block')).toBe(true);
            expect(element.hasClass('full-height')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a class-tab-header', function() {
            expect(element.find('class-block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a .padding and info-message', function() {
            expect(element.querySelectorAll('.padding').length).toBe(1);
            expect(element.find('info-message').length).toBe(1);
            
            discoverStateSvc.explore.classDetails = [{}];
            scope.$digest();
            
            expect(element.querySelectorAll('.padding').length).toBe(0);
            expect(element.find('info-message').length).toBe(0);
        });
        it('with a .content-container.full-height, class-details.details, and class-cards.cards', function() {
            expect(element.querySelectorAll('.content-container.full-height').length).toBe(0);
            expect(element.querySelectorAll('class-details.details').length).toBe(0);
            expect(element.querySelectorAll('class-cards.cards').length).toBe(0);
            
            discoverStateSvc.explore.classDetails = [{}];
            scope.$digest();
            
            expect(element.querySelectorAll('.content-container.full-height').length).toBe(1);
            expect(element.querySelectorAll('class-details.details').length).toBe(1);
            expect(element.querySelectorAll('class-cards.cards').length).toBe(1);
        });
    });
});