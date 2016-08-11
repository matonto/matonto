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
describe('Mapping Overlays directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc;

    beforeEach(function() {
        module('templates');
        module('mappingOverlays');
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        
        inject(function(_ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {jsonld: []};
            this.element = $compile(angular.element('<mapping-overlays></mapping-overlays>'))(scope);
            scope.$digest();
        });
        it('should set the correct state for reseting', function() {
            var controller = this.element.controller('mappingOverlays');
            controller.reset();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mappingManagerSvc.mapping).toBe(undefined);
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
        it('should test whether an entity is a class mapping', function() {
            var controller = this.element.controller('mappingOverlays');
            mappingManagerSvc.mapping.jsonld = [{'@id': 'test', '@type': 'ClassMapping'}, {'@id': ''}];
            var result = controller.isClassMapping('test');
            expect(mappingManagerSvc.isClassMapping).toHaveBeenCalledWith({'@id': 'test', '@type': 'ClassMapping'});
            expect(result).toBe(true);

            result = controller.isClassMapping('');
            expect(mappingManagerSvc.isClassMapping).toHaveBeenCalledWith({'@id': ''});
            expect(result).toBe(false);
        });
        it('should get the name of the entity being deleting', function() {
            var controller = this.element.controller('mappingOverlays');
            spyOn(controller, 'isClassMapping').and.returnValue(true);
            controller.getDeleteEntityName();
            expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
            expect(mappingManagerSvc.getClassIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
            expect(ontologyManagerSvc.getEntity).toHaveBeenCalled();
            expect(mappingManagerSvc.getPropIdByMappingId).not.toHaveBeenCalled();
            expect(mappingManagerSvc.findClassWithDataMapping).not.toHaveBeenCalled();
            expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getClassProperty).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();

            mappingManagerSvc.getSourceOntology.calls.reset();
            mappingManagerSvc.getClassIdByMappingId.calls.reset();
            ontologyManagerSvc.getEntity.calls.reset();
            controller.isClassMapping.and.returnValue(false);
            mappingManagerSvc.findClassWithDataMapping.and.returnValue({});
            controller.getDeleteEntityName();
            expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
            expect(mappingManagerSvc.getClassIdByMappingId).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
            expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getClassProperty).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();

            mappingManagerSvc.findClassWithDataMapping.and.returnValue(undefined);
            controller.getDeleteEntityName();
            expect(mappingManagerSvc.getSourceOntology).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld);
            expect(mappingManagerSvc.getClassIdByMappingId).not.toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntity).not.toHaveBeenCalled();
            expect(mappingManagerSvc.getPropIdByMappingId).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
            expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, mapperStateSvc.deleteId);
            expect(ontologyManagerSvc.getClassProperty).toHaveBeenCalled();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
        });
        it('should delete an entity from the mapping', function() {
            var controller = this.element.controller('mappingOverlays');
            spyOn(controller, 'isClassMapping').and.returnValue(true);
            var deleteId = 'test';
            mapperStateSvc.deleteId = deleteId;
            mapperStateSvc.openedClasses = [deleteId];
            scope.$digest();
            controller.deleteEntity();
            expect(mapperStateSvc.openedClasses).not.toContain(deleteId);
            expect(mappingManagerSvc.removeClass).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, deleteId);
            expect(mappingManagerSvc.findClassWithDataMapping).not.toHaveBeenCalled();
            expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
            expect(mappingManagerSvc.removeProp).not.toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.deleteId).toBe('');

            controller.isClassMapping.and.returnValue(false);
            mappingManagerSvc.findClassWithDataMapping.and.returnValue({});
            mapperStateSvc.deleteId = deleteId;
            controller.deleteEntity();
            expect(mappingManagerSvc.removeClass).not.toHaveBeenCalledWith();
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, deleteId);
            expect(mappingManagerSvc.findClassWithObjectMapping).not.toHaveBeenCalled();
            expect(mappingManagerSvc.removeProp).toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.deleteId).toBe('');

            mappingManagerSvc.findClassWithDataMapping.and.returnValue(undefined);
            mapperStateSvc.deleteId = deleteId;
            controller.deleteEntity();
            expect(mappingManagerSvc.removeClass).not.toHaveBeenCalledWith();
            expect(mappingManagerSvc.findClassWithDataMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, deleteId);
            expect(mappingManagerSvc.findClassWithObjectMapping).toHaveBeenCalledWith(mappingManagerSvc.mapping.jsonld, deleteId);
            expect(mappingManagerSvc.removeProp).toHaveBeenCalled();
            expect(mapperStateSvc.changedMapping).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(mapperStateSvc.deleteId).toBe('');
        });
        it('should delete a mapping', function() {
            var controller = this.element.controller('mappingOverlays');
            var name = 'test';
            mappingManagerSvc.mapping.name = name;
            controller.deleteMapping();
            scope.$apply();
            expect(mappingManagerSvc.deleteMapping).toHaveBeenCalledWith(name);
            expect(mappingManagerSvc.mapping).toEqual(undefined);
            expect(mappingManagerSvc.sourceOntologies).toEqual([]);
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<mapping-overlays></mapping-overlays>'))(scope);
            scope.$digest();
        });
        it('depending on the state step', function() {
            mapperStateSvc.step = 0;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.fileUploadStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(1);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.ontologySelectStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(1);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.startingClassSelectStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(1);
            expect(this.element.find('finish-overlay').length).toBe(0);

            mapperStateSvc.step = mapperStateSvc.finishStep;
            scope.$digest();
            expect(this.element.find('file-upload-overlay').length).toBe(0);
            expect(this.element.find('ontology-select-overlay').length).toBe(0);
            expect(this.element.find('starting-class-select-overlay').length).toBe(0);
            expect(this.element.find('finish-overlay').length).toBe(1);
        });
        it('depending on whether the mapping name is being edited', function() {
            mapperStateSvc.editMappingName = true;
            scope.$digest();
            expect(this.element.find('mapping-name-overlay').length).toBe(1);

            mapperStateSvc.editMappingName = false;
            scope.$digest();
            expect(this.element.find('mapping-name-overlay').length).toBe(0);
        });
        it('depending on whether the ontology is being previewed', function() {
            mapperStateSvc.previewOntology = true;
            scope.$digest();
            expect(this.element.find('ontology-preview-overlay').length).toBe(1);

            mapperStateSvc.previewOntology = false;
            scope.$digest();
            expect(this.element.find('ontology-preview-overlay').length).toBe(0);
        });
        it('depending on whether an IRI template is being edited', function() {
            mapperStateSvc.editIriTemplate = true;
            scope.$digest();
            expect(this.element.find('iri-template-overlay').length).toBe(1);

            mapperStateSvc.editIriTemplate = false;
            scope.$digest();
            expect(this.element.find('iri-template-overlay').length).toBe(0);
        });
        it('depending on whether the soruce ontology is invalid', function() {
            mapperStateSvc.invalidOntology = true;
            scope.$digest();
            expect(this.element.find('invalid-ontology-overlay').length).toBe(1);

            mapperStateSvc.invalidOntology = false;
            scope.$digest();
            expect(this.element.find('invalid-ontology-overlay').length).toBe(0);
        });
        it('depending on whether a cancel should be confirmed', function() {
            mapperStateSvc.displayCancelConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('cancel-confirm')).toBe(true);

            mapperStateSvc.displayCancelConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether creating a new mapping should be confirmed', function() {
            mapperStateSvc.displayNewMappingConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('create-new-mapping')).toBe(true);

            mapperStateSvc.displayNewMappingConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting an entity should be confirmed', function() {
            mappingManagerSvc.mapping = {jsonld: []};
            mapperStateSvc.displayDeleteEntityConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-entity')).toBe(true);

            mapperStateSvc.displayDeleteEntityConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting a mapping should be confirmed', function() {
            mapperStateSvc.displayDeleteMappingConfirm = true;
            scope.$digest();
            var overlay = this.element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-mapping')).toBe(true);

            mapperStateSvc.displayDeleteMappingConfirm = false;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(0);
        });
    });
});