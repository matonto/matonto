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

    function focusMe() {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                scope.$watch(attrs.focusMe, function(newValue) {
                    newValue && elem[0].focus()
                });
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name focusMe
         *
         * @description
         * The `focusMe` module provides the `focusMe` directive which provides a way to focus an element when it
         * becomes visible.
         */
        .module('focusMe', [])
        /**
         * @ngdoc directive
         * @name focusMe.directive:focusMe
         * @restrict A
         *
         * @description
         * `focusMe` is a directive that sets the focus of the element it is set on when it becomes visible if the
         * directive value is set to true.
         */
        .directive('focusMe', focusMe);
})();