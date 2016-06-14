describe('Tab Button Container directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('tabButtonContainer');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('replaces the directive with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<tab-button-container></tab-button-container>'))(scope);
            scope.$digest();
        });
        it('based on tag', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
        });
        it('based on class name', function() {
            expect(this.element.hasClass('tab-button-container')).toBe(true);
        });
    });
});