/*-
 * #%L
 * itests-web
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
var adminUsername = 'admin'
var adminPassword = 'admin'
var Onto1 = process.cwd()+ '/src/test/resources/ontologies/active-entity-filter-1.ttl'
var Onto2 = process.cwd()+ '/src/test/resources/ontologies/active-entity-filter-2.ttl'
var Onto3 = process.cwd()+ '/src/test/resources/ontologies/active-entity-filter-3.ttl'

module.exports = {
    '@tags': ['sanity', "ontology-editor"],

    'Step 1: Initial Setup' : function(browser) {
        browser.globals.initial_steps(browser, adminUsername, adminPassword)
    },

    'Step 2: Upload Ontologies' : function(browser) {
        browser.globals.upload_ontologies(browser, Onto1, Onto2, Onto3)
    },

    'Step 3: Open active-entity-filter-1 Ontology' : function (browser) {
        browser.globals.open_ontology(browser, Onto1)
    },

    'Step 4: Click classes tab' : function (browser) {
        browser
            .waitForElementVisible('div.material-tabset li.nav-item')
            .click('xpath', '//div[contains(@class, "material-tabset")]//li[contains(@class, "nav-item")]//span[text()[contains(., "Classes")]]')
    },

    'Step 5: Check for Ontology classes' : function (browser) {
        browser
            .waitForElementVisible('div.tree')
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 0")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Other Class")]]'})
            .assert.elementNotPresent({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
    },

    'Step 6: Click on an imported class' : function (browser) {
        browser
            .useCss()
            .click('xpath', '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Other Class")]]//parent::a')
            .waitForElementNotPresent('.spinner')
            .waitForElementVisible('selected-details .entity-name')
            .assert.containsText('selected-details .entity-name', 'Other Class')
    },

    'Step 7: Apply the Active Entity Filter' : function (browser) {
        browser
            .waitForElementVisible('.hierarchy-filter a')
            .click('.hierarchy-filter a')
            .waitForElementVisible('class-hierarchy-block .dropdown-menu checkbox')
            .click('class-hierarchy-block .dropdown-menu checkbox input')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]'})
            .click('xpath', '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]')
            .waitForElementNotVisible('class-hierarchy-block .dropdown-menu checkbox')
    },

    'Step 8: Ensure that imported entities have been filtered out' : function(browser) {
        browser
            .waitForElementNotPresent({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3")]]'})
            .waitForElementNotPresent({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Other Class")]]'})
    },

    'Step 9: Ensure that all active entities are visible' : function(browser) {
        browser
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
            .assert.visible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 0")]]'})
    },

    'Step 10: Ensure that imported parents of active entities are visible' : function(browser) {
        browser
            .assert.visible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]'})
    },

    'Step 11: Ensure the selected entity view is still visible to the user, even if the entity is filtered out of the active list.': function(browser) {
        browser
            .assert.containsText('selected-details .entity-name', 'Other Class')
    },

    'Step 12: Remove the Active Entity filter' : function(browser) {
        browser
            .click('.hierarchy-filter a')
            .waitForElementVisible('class-hierarchy-block .dropdown-menu checkbox')
            .click('class-hierarchy-block .dropdown-menu checkbox input')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]'})
            .click('xpath', '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]')
            .waitForElementNotVisible('class-hierarchy-block .dropdown-menu checkbox')

    },

    'Step 13: Verify the Active Entity filtered state was applied to the pre-filtered state' : function(browser) {
        browser
            .useXpath()
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 0")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 2")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 3")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Other Class")]]'})
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//div[contains(@class, "tree-item-wrapper")]//span[text()[contains(., "Class 1")]]'})
    },

    'Step 14: Verify that a message is displayed when no entities match the filter criteria' : function(browser) {
        browser
            .useCss()
            .assert.visible('search-bar input')
            .setValue('search-bar input', '3')
            .click('.hierarchy-filter a')
            .waitForElementVisible('class-hierarchy-block .dropdown-menu checkbox')
            .click('class-hierarchy-block .dropdown-menu checkbox input')
            .waitForElementVisible({locateStrategy: 'xpath', selector: '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]'})
            .click('xpath', '//ul[contains(@class, "dropdown-menu")]//button[text()[contains(., "Apply")]]')
            .waitForElementNotVisible('class-hierarchy-block .dropdown-menu checkbox')
            .waitForElementVisible('info-message p')
            .assert.containsText('info-message p', 'No classes match your filter.')
    }
}