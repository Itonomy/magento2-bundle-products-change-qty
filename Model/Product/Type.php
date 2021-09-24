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
        if ($selection->getSelectionCanChangeQty()) {
            $qty = $qtys[$selectionOptionId] ?? 1.0;
        } else {
            $qty = $selection->getSelectionQty();
        }
        return (float) \max($qty , 1.0);
    }
}
