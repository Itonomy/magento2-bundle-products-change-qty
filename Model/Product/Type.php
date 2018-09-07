<?php

namespace Itonomy\BundleProductChangeQty\Model\Product;

class Type extends \Magento\Bundle\Model\Product\Type
{
    /**
     * This allows us to add bundle option products with a qty more than one.
     * Defaults back to 1 when this is not possible.
     * This disregards the getSelectionCanChangeQty on checkbox elements.
     *
     * @param \Magento\Framework\DataObject $selection
     * @param int[] $qtys
     * @param int $selectionOptionId
     * @return float|int
     */
    protected function getQty($selection, $qtys, $selectionOptionId)
    {
        if ($selection->getSelectionCanChangeQty() && isset($qtys[$selectionOptionId])) {
            $qty = (float)$qtys[$selectionOptionId] > 0 ? $qtys[$selectionOptionId] : 1;
        } elseif (isset($qtys[$selectionOptionId][$selection->getId()])) {
            $qty = (float)$qtys[$selectionOptionId][$selection->getId()] ? $qtys[$selectionOptionId][$selection->getId()] : 1;
        } else {
            $qty = (float)$selection->getSelectionQty() ? $selection->getSelectionQty() : 1;
        }
        $qty = (float)$qty;

        return $qty;
    }
}
