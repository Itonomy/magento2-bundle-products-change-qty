define([
    'jquery',
    'underscore',
    'mage/template',
    'priceUtils',
    'priceBox'
], function ($, _, mageTemplate, utils) {
    'use strict';
    return function (originalWidget) {
        $.widget('mage.priceBundle',
            $['mage']['priceBundle'],
            {
                /**
                 * Handle change on bundle option inputs
                 * @param {jQuery.Event} event
                 * @private
                 */
                _onBundleOptionChanged: function onBundleOptionChanged(event) {
                    var changes,
                        bundleOption = $(event.target),
                        priceBox = $(this.options.priceBoxSelector, this.element),
                        handler = this.options.optionHandlers[bundleOption.data('role')];

                    bundleOption.data('optionContainer', bundleOption.closest(this.options.controlContainer));
                    bundleOption.data('qtyField', bundleOption.data('optionContainer').find(this.options.qtyFieldSelector));

                    if (handler && handler instanceof Function) {
                        changes = handler(bundleOption, this.options.optionConfig, this);
                    } else {
                        changes = defaultGetOptionValue(bundleOption, this.options.optionConfig);//eslint-disable-line
                    }

                    if (changes) {
                        priceBox.trigger('updatePrice', changes);
                    }
                    this.updateProductSummary();
                }
            }
        )
    };

    /**
     * Converts option value to priceBox object
     *
     * @param   {jQuery} element
     * @param   {Object} config
     * @returns {Object|null} - priceBox object with additional prices
     */
    function defaultGetOptionValue(element, config) {
        var changes = {},
            optionHash,
            tempChanges,
            qtyField,
            optionId = utils.findOptionId(element[0]),
            optionValue = element.val() || null,
            optionName = element.prop('name'),
            optionType = element.prop('type'),
            optionConfig = config.options[optionId].selections,
            optionQty = 0,
            canQtyCustomize = false,
            selectedIds = config.selected;

        switch (optionType) {
            case 'radio':
            case 'select-one':

                if (optionType === 'radio' && !element.is(':checked')) {
                    return null;
                }

                qtyField = element.data('qtyField');
                qtyField.data('option', element);

                if (optionValue) {
                    optionQty = optionConfig[optionValue].qty || 0;
                    canQtyCustomize = optionConfig[optionValue].customQty === '1';
                    toggleQtyField(qtyField, optionQty, optionId, optionValue, canQtyCustomize);//eslint-disable-line
                    tempChanges = utils.deepClone(optionConfig[optionValue].prices);
                    tempChanges = applyTierPrice(//eslint-disable-line
                        tempChanges,
                        optionQty,
                        optionConfig[optionValue]
                    );
                    tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line
                } else {
                    tempChanges = {};
                    toggleQtyField(qtyField, '0', optionId, optionValue, false);//eslint-disable-line
                }
                optionHash = 'bundle-option-' + optionName;
                changes[optionHash] = tempChanges;
                selectedIds[optionId] = [optionValue];
                break;

            case 'select-multiple':
                optionValue = _.compact(optionValue);

                _.each(optionConfig, function (row, optionValueCode) {
                    optionHash = 'bundle-option-' + optionName + '##' + optionValueCode;
                    optionQty = row.qty || 0;
                    tempChanges = utils.deepClone(row.prices);
                    tempChanges = applyTierPrice(tempChanges, optionQty, optionConfig);//eslint-disable-line
                    tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line
                    changes[optionHash] = _.contains(optionValue, optionValueCode) ? tempChanges : {};
                });

                selectedIds[optionId] = optionValue || [];
                break;

            case 'checkbox':
                optionHash = 'bundle-option-' + optionName + '##' + optionValue;
                qtyField = element.data('qtyField');

                if (qtyField.length > 1) {
                    // select qty by given optionId + value.
                    var selector = '#bundle-option-' + optionId + '-' + optionValue + '-qty-input';
                    element = element.data('qtyField', $(selector));
                    qtyField = element.data('qtyField');
                }

                qtyField.data('option', element);

                if (optionValue) {
                    optionQty = optionConfig[optionValue].qty || 0;
                    canQtyCustomize = element.is(':checked');
                    toggleQtyField(qtyField, optionQty, optionId, optionValue, canQtyCustomize);//eslint-disable-line
                    tempChanges = utils.deepClone(optionConfig[optionValue].prices);
                    tempChanges = applyTierPrice(tempChanges, optionQty, optionConfig);//eslint-disable-line
                    tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line
                } else {
                    tempChanges = {};
                    toggleQtyField(qtyField, '0', optionId, optionValue, false);//eslint-disable-line
                }

                changes[optionHash] = element.is(':checked') ? tempChanges : {};
                selectedIds[optionId] = selectedIds[optionId] || [];

                if (!_.contains(selectedIds[optionId], optionValue) && element.is(':checked')) {
                    selectedIds[optionId].push(optionValue);
                } else if (!element.is(':checked')) {
                    selectedIds[optionId] = _.without(selectedIds[optionId], optionValue);
                }
                break;

            case 'hidden':
                optionHash = 'bundle-option-' + optionName + '##' + optionValue;
                optionQty = optionConfig[optionValue].qty || 0;
                canQtyCustomize = optionConfig[optionValue].customQty === '1';
                qtyField = element.data('qtyField');
                qtyField.data('option', element);
                toggleQtyField(qtyField, optionQty, optionId, optionValue, canQtyCustomize);//eslint-disable-line
                tempChanges = utils.deepClone(optionConfig[optionValue].prices);
                tempChanges = applyTierPrice(tempChanges, optionQty, optionConfig);//eslint-disable-line
                tempChanges = applyQty(tempChanges, optionQty);//eslint-disable-line

                optionHash = 'bundle-option-' + optionName;
                changes[optionHash] = tempChanges;
                selectedIds[optionId] = [optionValue];
                break;
        }

        return changes;
    }

    /**
     * Helper to toggle qty field
     * @param {jQuery} element
     * @param {String|Number} value
     * @param {String|Number} optionId
     * @param {String|Number} optionValueId
     * @param {Boolean} canEdit
     */
    function toggleQtyField(element, value, optionId, optionValueId, canEdit) {
        element
            .val(value)
            .data('optionId', optionId)
            .data('optionValueId', optionValueId)
            .attr('disabled', !canEdit);

        if (canEdit) {
            element.removeClass('qty-disabled');
        } else {
            element.addClass('qty-disabled');
        }
    }

    /**
     * Helper to multiply on qty
     *
     * @param   {Object} prices
     * @param   {Number} qty
     * @returns {Object}
     */
    function applyQty(prices, qty) {
        _.each(prices, function (everyPrice) {
            everyPrice.amount *= qty;
            _.each(everyPrice.adjustments, function (el, index) {
                everyPrice.adjustments[index] *= qty;
            });
        });

        return prices;
    }

    /**
     * Helper to limit price with tier price
     *
     * @param {Object} oneItemPrice
     * @param {Number} qty
     * @param {Object} optionConfig
     * @returns {Object}
     */
    function applyTierPrice(oneItemPrice, qty, optionConfig) {
        var tiers = optionConfig.tierPrice,
            magicKey = _.keys(oneItemPrice)[0],
            lowest = false;

        _.each(tiers, function (tier, index) {
            if (tier['price_qty'] > qty) {
                return;
            }

            if (tier.prices[magicKey].amount < oneItemPrice[magicKey].amount) {
                lowest = index;
            }
        });

        if (lowest !== false) {
            oneItemPrice = utils.deepClone(tiers[lowest].prices);
        }

        return oneItemPrice;
    }
});