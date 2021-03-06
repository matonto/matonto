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
import { DebugElement } from '@angular/core';
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MockComponent } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import {
    cleanStylesFromDOM, mockPrefixes, mockUtil
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { PreferenceFormComponent } from '../preferenceForm/preferenceForm.component';
import { PreferenceConstants } from '../../classes/preferenceConstants.class';
import { SimplePreference } from '../../classes/simplePreference.class';
import { Preference } from '../../interfaces/preference.interface';
import { PreferenceFormFieldComponent } from '../preferenceFormField/preferenceFormField.component';
import { FormArray } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { get, has, set } from 'lodash';

describe('Preference Form component', function() {
    let component: PreferenceFormComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PreferenceFormComponent>;
    let testUserPreference;
    let testPreferenceDefinitions;
    let testPreference: Preference;
    let utilStub;
    let prefixStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                SharedModule,
                NoopAnimationsModule,
            ],
            declarations: [
                MockComponent(PreferenceFormFieldComponent),
                PreferenceFormComponent
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PreferenceFormComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.get('utilService');
        prefixStub = TestBed.get('prefixes');

        utilStub.getPropertyValue.and.callFake((entity, propertyIRI) => {
            return get(entity, "['" + propertyIRI + "'][0]['@value']", '');
        });

        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, "['" + propertyIRI + "'][0]['@id']", '');
        });

        utilStub.setPropertyValue.and.callFake((entity, propertyIRI, value) => {
            if (has(entity, "['" + propertyIRI + "']")) {
                entity[propertyIRI].push({'@value': value});
            } else {
                set(entity, "['" + propertyIRI + "'][0]", {'@value': value});
            }
        });

        testUserPreference = [{
            "@id": "http://mobi.com/preference#45e225a4-90f6-4276-b435-1b2888fdc01e",
            "@type": [
                "http://www.w3.org/2002/07/owl#Thing",
                "preference:Preference",
                "preference:SomeSimpleTextPreference",
                "preference:Setting"
            ],
            "preference:forUser": [
                {
                    "@id": "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997"
                }
            ],
            "http://mobi.com/ontologies/preference#hasDataValue": [
                {
                    "@value": "first"
                }
            ]
        }];

        testPreferenceDefinitions = {
            "preference:SomeSimpleTextPreference": { "@id" : "preference:SomeSimpleTextPreference",
            "@type" : [ "http://www.w3.org/2002/07/owl#Class", "shacl:NodeShape" ],
            "preference:inGroup" : [ {
              "@id" : "preference:TestPrefGroupA"
            } ],
            "http://www.w3.org/2000/01/rdf-schema#subClassOf" : [ {
              "@id" : "preference:Preference"
            } ],
            "shacl:description" : [ {
              "@language" : "en",
              "@value" : "Enter a value for this simple text preference"
            } ],
            "shacl:property" : [ {
              "@id" : "preference:SomeSimpleTextPreferencePropertyShape"
            } ]
          },
          "preference:SomeSimpleTextPreferencePropertyShape": {
            "@id" : "preference:SomeSimpleTextPreferencePropertyShape",
            "@type" : [ "shacl:PropertyShape" ],
            "preference:usesFormField" : [ {
              "@id" : "preference:TextInput"
            } ],
            "shacl:datatype" : [ {
              "@id" : "http://www.w3.org/2001/XMLSchema#string"
            } ],
            "shacl:maxCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "2"
            } ],
            "shacl:minCount" : [ {
              "@type" : "http://www.w3.org/2001/XMLSchema#integer",
              "@value" : "1"
            } ],
            "shacl:path" : [ {
              "@id" : "http://mobi.com/ontologies/preference#hasDataValue"
            } ]
          }
        };

        testPreference = new SimplePreference(testPreferenceDefinitions['preference:SomeSimpleTextPreference'], testPreferenceDefinitions, utilStub, prefixStub);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('controller methods', function() {
        describe('onChanges', function() {
            describe('should set maxBlocks', function() {
                it('when a shacl maximum exists', function() {
                    testPreference.populate(testUserPreference);
                    component.preference = testPreference;
                    fixture.detectChanges();
                    component.ngOnChanges();
                    expect(component.maxBlocks).toEqual(2);     
                });
                it('when no shacl maximum exists', function() {
                    delete testPreferenceDefinitions['preference:SomeSimpleTextPreferencePropertyShape']['shacl:maxCount'];
                    testPreference = new SimplePreference(testPreferenceDefinitions['preference:SomeSimpleTextPreference'], testPreferenceDefinitions, utilStub, prefixStub);
                    testPreference.populate(testUserPreference);
                    component.preference = testPreference;
                    fixture.detectChanges();
                    expect(component.maxBlocks).toEqual(1000);    
                });
            });
            describe('should set numValues', function() {
                it('based on the number of preference values', function() {
                    testPreference.populate(testUserPreference);
                    component.preference = testPreference;
                    fixture.detectChanges();
                    component.ngOnChanges();
                    expect(component.numValues).toEqual(1);
                    testUserPreference[0][PreferenceConstants.HAS_DATA_VALUE] = [
                        {
                            '@value': 'first'
                        },
                        {
                            '@value': 'second'
                        },
                        {
                            '@value': 'third'
                        }
                    ];
                    testPreference.populate(testUserPreference);
                    component.preference = testPreference;
                    fixture.detectChanges();
                    component.ngOnChanges();
                    expect(component.numValues).toEqual(3);
                });
            });
            describe('should set shaclShapes', function() {
                it('correctly', function() {
                    testPreference.populate(testUserPreference);
                    component.preference = testPreference;
                    fixture.detectChanges();
                    component.ngOnChanges();
                    expect(component.shaclShapes).toEqual({
                        'http://mobi.com/ontologies/preference#hasDataValue': testPreferenceDefinitions['preference:SomeSimpleTextPreferencePropertyShape']
                    })
                });
            });
            describe('should build the form', function() {
                it('when a single preference value exists', function() {
                    testPreference.populate(testUserPreference);
                    component.preference = testPreference;
                    fixture.detectChanges();
                    component.ngOnChanges();
                    expect((component.form.get('formBlocks') as FormArray).length).toEqual(1);
                    expect(component.form.get('formBlocks').get(['0', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('first');
                });
                it('when a multiple preference values exists', function() {
                    testUserPreference[0][PreferenceConstants.HAS_DATA_VALUE] = [
                        {
                            '@value': 'first'
                        },
                        {
                            '@value': 'second'
                        },
                        {
                            '@value': 'third'
                        }
                    ];
                    testPreference.populate(testUserPreference);
                    component.preference = testPreference;
                    fixture.detectChanges();
                    component.ngOnChanges();
                    expect((component.form.get('formBlocks') as FormArray).length).toEqual(3);
                    expect(component.form.get('formBlocks').get(['0', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('first');
                    expect(component.form.get('formBlocks').get(['1', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('second');
                    expect(component.form.get('formBlocks').get(['2', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('third');
                });
            });
        });
        it('should add a formBlock', function() {
            testPreference.populate(testUserPreference);
            component.preference = testPreference;
            fixture.detectChanges();
            component.ngOnChanges();
            expect((component.form.get('formBlocks') as FormArray).length).toEqual(1);
            expect(testPreference.values[0][PreferenceConstants.HAS_DATA_VALUE].length).toEqual(1);
            expect(component.numValues).toEqual(1);
            expect(component.form.dirty).toEqual(false);

            component.addFormBlock();
            fixture.detectChanges();
            expect((component.form.get('formBlocks') as FormArray).length).toEqual(2);
            expect(component.form.get('formBlocks').get(['1', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('');
            expect(testPreference.values[0][PreferenceConstants.HAS_DATA_VALUE].length).toEqual(2);
            expect(component.numValues).toEqual(2);
            expect(component.form.dirty).toEqual(true);

            component.addFormBlock();
            fixture.detectChanges();
            expect((component.form.get('formBlocks') as FormArray).length).toEqual(3);
            expect(component.form.get('formBlocks').get(['1', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('');
            expect(component.form.get('formBlocks').get(['2', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('');
            expect(component.numValues).toEqual(3);
            expect(testPreference.values[0][PreferenceConstants.HAS_DATA_VALUE].length).toEqual(3);
            expect(component.form.dirty).toEqual(true);
        });
        it('should delete a formBlock', function() {
            testUserPreference[0][PreferenceConstants.HAS_DATA_VALUE] = [
                {
                    '@value': 'first'
                },
                {
                    '@value': 'second'
                },
                {
                    '@value': 'third'
                }
            ];
            testPreference.populate(testUserPreference);
            component.preference = testPreference;
            fixture.detectChanges();
            component.ngOnChanges();

            expect((component.form.get('formBlocks') as FormArray).length).toEqual(3);

            component.deleteFormBlock(1);
            fixture.detectChanges();
            expect((component.form.get('formBlocks') as FormArray).length).toEqual(2);
            
            expect(component.form.get('formBlocks').get(['0', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('first');
            expect(component.form.get('formBlocks').get(['1', 'http://mobi.com/ontologies/preference#hasDataValue', 'http://mobi.com/ontologies/preference#hasDataValue']).value).toEqual('third');

            expect(component.form.dirty).toEqual(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            testPreference.populate(testUserPreference);
            component.preference = testPreference;
            fixture.detectChanges();
            component.ngOnChanges();
            fixture.detectChanges();
            expect(component.maxBlocks).toEqual(2);
            expect(element.queryAll(By.css('form')).length).toEqual(1);
            expect(element.queryAll(By.css('preference-form-field')).length).toEqual(1);
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();
            expect(element.queryAll(By.css('.add-block-button')).length).toEqual(1);
            expect(element.queryAll(By.css('.delete-block-button')).length).toEqual(0);
        });
        it('when maxBlocks is reached', function() {
            testUserPreference[0][PreferenceConstants.HAS_DATA_VALUE] = [
                {
                    '@value': 'first'
                },
                {
                    '@value': 'second'
                }
            ];
            testPreference.populate(testUserPreference);
            component.preference = testPreference;
            fixture.detectChanges();
            component.ngOnChanges();
            fixture.detectChanges();
            expect(component.maxBlocks).toEqual(2);
            expect((component.form.get('formBlocks') as FormArray).length).toEqual(2);
            expect(element.queryAll(By.css('form')).length).toEqual(1);
            expect(element.queryAll(By.css('preference-form-field')).length).toEqual(2);
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();
            expect(element.queryAll(By.css('.add-block-button')).length).toEqual(0);
            expect(element.queryAll(By.css('.delete-block-button')).length).toEqual(2);
        });
    });
});