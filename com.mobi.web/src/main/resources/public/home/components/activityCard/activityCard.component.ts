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
import { get } from 'lodash';
import {Component, Inject, OnDestroy, OnInit} from "@angular/core";

/**
 * @ngdoc component
 * @name home.component:activityCard
 * @requires shared.service:provManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 * @requires shared.service:httpService
 *
 * @description
 * `activityCard` is a component which creates a Bootstrap `.card` containing a infinite scrolled list of the
 * most recent activities in the application. The activities are loaded 10 at a time and are displayed using
 * {@link home.component:activityTitle activityTitles}.
 */
@Component({
    selector: 'activity-card',
    templateUrl: './activityCard.component.html'
})
export class ActivityCardComponent implements OnInit, OnDestroy {
    private increment = 10;

    public limit = this.increment;
    public id = 'activity-log';
    public activities = [];
    public entities = [];
    public totalSize = 0;
    
    constructor(@Inject('provManagerService') public pm, @Inject('utilService') public util, @Inject('prefixes') private prefixes,
                @Inject('httpService') private httpService) {}
    
    ngOnInit(): void {
        this.setPage();
        console.log('ON INIT CALLED!');
    }
    ngOnDestroy(): void {
        this.httpService.cancel(this.id);
    }
    loadMore() {
        this.limit += this.increment;
        this.setPage();
    }
    setPage() {
        this.httpService.cancel(this.id);
        this.pm.getActivities(this.getConfig(), this.id).then(this.setActivities, this.createToast);
    }
    getTimeStamp(activity) {
        let dateStr = this.util.getPropertyValue(activity, this.prefixes.prov + 'endedAtTime');
        return this.util.getDate(dateStr, 'short')
    }
    setActivities(response) {
        console.log('Activities Set: ', response.data.activities);
        this.activities = response.data.activities;
        this.entities = response.data.entities;
        let headers = response.headers();
        this.totalSize = get(headers, 'x-total-count', 0);
    }
    createToast(errorMessage) {
        if (errorMessage) {
            this.util.createErrorToast(errorMessage);
        }
    }
    getConfig() {
        return {pageIndex: 0, limit: this.limit};
    }
    trackByFn(index, item) {
        return item['@id'];
    }
}