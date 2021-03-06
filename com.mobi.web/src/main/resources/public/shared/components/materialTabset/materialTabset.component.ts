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

import { pull, isEqual, forEach } from 'lodash';

import './materialTabset.component.scss';

const template = require('./materialTabset.component.html');

/**
 * @ngdoc component
 * @name shared.component:materialTabset
 *
 * @description
 * `materialTabset` is a component that creates a `div` containing {@link shared.component:materialTab tabs} and
 * headers about the tabs displayed as `.nav-tabs`. The tabs are transcluded into this component and headers are
 * generated for them.
 * 
 * @param {boolean} centered Whether the tab headings should be centered instead of left aligned
 */
const materialTabsetComponent = {
    template,
    transclude: true,
    bindings: {
        centered: '@'
    },
    controllerAs: 'dvm',
    controller: materialTabsetComponentCtrl
};

materialTabsetComponentCtrl.$inject = ['$timeout'];

function materialTabsetComponentCtrl($timeout) {
    var dvm = this;
    dvm.tabs = [];

    dvm.$onInit = function() {
        dvm.isCentered = dvm.centered !== undefined;
    }
    dvm.addTab = function(tab) {
        dvm.tabs.push(tab);
    }
    dvm.removeTab = function(tab) {
        pull(dvm.tabs, tab);
    }
    dvm.select = function(selectedTab) {
        forEach(dvm.tabs, tab => {
            if (tab.active && !isEqual(tab, selectedTab)) {
                tab.setActive({value: false});
            }
        });
        $timeout(function() {
            selectedTab.onClick();
            selectedTab.setActive({value: true});
        });
    }
}

export default materialTabsetComponent;
