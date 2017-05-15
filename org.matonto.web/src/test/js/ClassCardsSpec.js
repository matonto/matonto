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
describe('Class Cards directive', function() {
    var $compile, scope, element, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('classCards');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        discoverStateSvc.explore.classDetails = [{
            count: 1,
            label: 'z'
        }, {
            count: 2,
            label: 'z'
        }, {
            count: 2,
            label: 'a'
        }, {
            count: 1,
            label: 'a'
        }];
        element = $compile(angular.element('<class-cards></class-cards>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('class-cards')).toBe(true);
            expect(element.hasClass('full-height')).toBe(true);
        });
        it('with a .rows-container.full-height', function() {
            expect(element.querySelectorAll('.rows-container.full-height').length).toBe(1);
        });
        it('with a .row', function() {
            expect(element.querySelectorAll('.row').length).toBe(2);
        });
        it('with a .col-xs-4.card-container', function() {
            expect(element.querySelectorAll('.col-xs-4.card-container').length).toBe(4);
        });
        it('with a md-card', function() {
            expect(element.find('md-card').length).toBe(4);
        });
        it('with a md-card-title', function() {
            expect(element.find('md-card-title').length).toBe(4);
        });
        it('with a md-card-title-text', function() {
            expect(element.find('md-card-title-text').length).toBe(4);
        });
        it('with a .card-header', function() {
            expect(element.querySelectorAll('.card-header').length).toBe(4);
        });
        it('with a .md-headline.text', function() {
            expect(element.querySelectorAll('.md-headline.text').length).toBe(4);
        });
        it('with a .badge', function() {
            expect(element.querySelectorAll('.badge').length).toBe(4);
        });
        it('with a md-card-content', function() {
            expect(element.find('md-card-content').length).toBe(4);
        });
        it('with a .class-overview', function() {
            expect(element.querySelectorAll('.class-overview').length).toBe(4);
        });
        it('with a .text-muted', function() {
            expect(element.querySelectorAll('.text-muted').length).toBe(8);
        });
    });
    it('properly defines controller.chunks on load', function() {
        var expected = [[{
            count: 2,
            label: 'a'
        }, {
            count: 2,
            label: 'z'
        }, {
            count: 1,
            label: 'a'
        }], [{
            count: 1,
            label: 'z'
        }]];
        expect(angular.copy(element.controller('classCards').chunks)).toEqual(expected);
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('classCards');
        });
        it('exploreData should set the correct variables', function() {
            discoverStateSvc.explore.breadcrumbs = [''];
            controller.exploreData({label: 'new'});
            expect(discoverStateSvc.explore.breadcrumbs).toEqual(['', 'new']);
        });
    });
});