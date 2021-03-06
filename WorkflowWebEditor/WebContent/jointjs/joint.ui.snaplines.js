/*! Rappid - the diagramming toolkit

Copyright (c) 2014 client IO

 2014-09-16 


This Source Code Form is subject to the terms of the Rappid Academic License
, v. 1.0. If a copy of the Rappid License was not distributed with this
file, You can obtain one at http://jointjs.com/license/rappid_academic_v1.txt
 or from the Rappid archive as was distributed by client IO. See the LICENSE file.*/


//  Snaplines plugin
//-------------------

// Snaplines plugin helps creating diagramms by snapping elements to better-looking positions
// (aligned with other elements) while they are dragged. It's an alternative to layout algorithms.

joint.ui.Snaplines = Backbone.View.extend({

    options: {
        paper: undefined,
        distance: 10
    },

    className: 'snaplines',

    initialize: function(options) {

	this.options = _.extend({}, _.result(this, 'options'), options || {});

        this.$horizontal = $('<div>').addClass('snapline horizontal').appendTo(this.el);
        this.$vertical = $('<div>').addClass('snapline vertical').appendTo(this.el);

        this.$el.hide().appendTo(this.options.paper.el);

        this.startListening();
    },

    startListening: function() {

        this.stopListening();

        this.listenTo(this.options.paper, 'cell:pointerdown', this.startSnapping);
        this.listenTo(this.options.paper, 'cell:pointermove', this.snap);
        this.listenTo(this.options.paper, 'cell:pointerup', this.hide);
    },

    startSnapping: function(cellView, evt, x, y) {

        if (cellView instanceof joint.dia.LinkView) return;

        var position = cellView.model.get('position');

        // store the difference between top-left corner and pointer coordinates
        this._diffX = x - position.x;
        this._diffY = y - position.y;
    },

    snap: function(cellView, evt, x, y) {

        if (cellView instanceof joint.dia.LinkView) return;

        var cell = cellView.model;
        var cellBBox = g.rect(_.extend({ x: x - this._diffX, y: y - this._diffY }, cell.get('size')));
        var cellCenter = cellBBox.center();
        var cellBBoxRotated = cellBBox.bbox(cell.get('angle'));
        var cellTopLeft = cellBBoxRotated.origin();
        var cellBottomRight = cellBBoxRotated.corner();

        var distance = this.options.distance;
        var vertical = null;
        var horizontal = null;
        var verticalFix = 0;
        var horizontalFix = 0;

        // find vertical and horizontal lines by comparing top-left, bottom-right and center bbox points
        _.chain(this.options.paper.model.getElements()).without(cell).find(function(element) {

            var snapBBox = element.getBBox().bbox(element.get('angle'));
            var snapCenter = snapBBox.center();
            var snapTopLeft = snapBBox.origin();
            var snapBottomRight = snapBBox.corner();

            if (_.isNull(vertical)) {

                if (Math.abs(snapCenter.x - cellCenter.x) < distance) {
                    vertical = snapCenter.x;
                    verticalFix = 0.5;
                } else if (Math.abs(snapTopLeft.x - cellTopLeft.x) < distance) {
                    vertical = snapTopLeft.x;
                } else if (Math.abs(snapTopLeft.x - cellBottomRight.x) < distance) {
                    vertical = snapTopLeft.x;
                    verticalFix = 1;
                } else if (Math.abs(snapBottomRight.x - cellBottomRight.x) < distance) {
                    vertical = snapBottomRight.x;
                    verticalFix = 1;
                } else if (Math.abs(snapBottomRight.x - cellTopLeft.x) < distance) {
                    vertical = snapBottomRight.x;
                }
            }

            if (_.isNull(horizontal)) {

                if (Math.abs(snapCenter.y - cellCenter.y) < distance) {
                    horizontal = snapCenter.y;
                    horizontalFix = 0.5;
                } else if (Math.abs(snapTopLeft.y - cellTopLeft.y) < distance) {
                    horizontal = snapTopLeft.y;
                } else if (Math.abs(snapTopLeft.y - cellBottomRight.y) < distance) {
                    horizontal = snapTopLeft.y;
                    horizontalFix = 1;
                } else if (Math.abs(snapBottomRight.y - cellBottomRight.y) < distance) {
                    horizontal = snapBottomRight.y;
                    horizontalFix = 1;
                } else if (Math.abs(snapBottomRight.y - cellTopLeft.y) < distance) {
                    horizontal = snapBottomRight.y;
                }
            }

            // keeps looking until all elements processed or both vertical and horizontal line found
            return _.isNumber(vertical) && _.isNumber(horizontal);
        });

        this.hide();

        if (_.isNumber(vertical) || _.isNumber(horizontal)) {

            if (_.isNumber(vertical)) {
                cellBBoxRotated.x = vertical - verticalFix * cellBBoxRotated.width;
            }

            if (_.isNumber(horizontal)) {
                cellBBoxRotated.y = horizontal - horizontalFix * cellBBoxRotated.height;
            }

            // find x and y of the unrotated cell
            var newCellCenter = cellBBoxRotated.center();
            var newX = newCellCenter.x - cellBBox.width / 2;
            var newY = newCellCenter.y - cellBBox.height / 2;

            cell.set('position', { x: newX, y: newY });

            this.show({ vertical: vertical, horizontal: horizontal });
        }
    },

    show: function(opt) {

        opt = opt || {};

        var ctm = this.options.paper.viewport.getCTM();

        if (opt.horizontal) {
            this.$horizontal.css('top', opt.horizontal * ctm.d + ctm.f).show();
        } else {
            this.$horizontal.hide();
        }

        if (opt.vertical) {
            this.$vertical.css('left', opt.vertical * ctm.a + ctm.e).show();
        } else {
            this.$vertical.hide();
        }

        this.$el.show();
    },

    hide: function() {

        this.$el.hide();
    }
});
