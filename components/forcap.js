const handleUpdateDraft = async (event) => {
    try {
      const { data, nested } = poDraft[0];
      const { items } = nested;
      const itemsRows = tbody.querySelectorAll(".item");
      const itemsList = [];
      const to_insert_items = [];
      const to_update_items = [];
      const to_delete_items = items.map((item) => item.po_order_item_id);
      for (const itemRow of itemsRows) {
        ...
        const newItem = {
          po_order_id: poOrderId,
          orders_skus_id: orders_skus_id ? parseInt(orders_skus_id) : null,
          ...
          product_status_id: 8,
          ...(po_order_item_id && {
            po_order_item_id: parseInt(po_order_item_id),
          }),
        };
        itemsList.push(newItem);
      for (const itemInList of itemsList) {
        const index = to_delete_items.indexOf(itemInList.po_order_item_id);
        if (index !== -1) {
          let to_update_items_object = {};
          to_update_items_object = updatedObject(
            ...
          );
         
          if (Object.keys(to_update_items_object).length > 0) {
            to_update_items_object = updatedObject(
              ...
            );
            to_update_items.push(to_update_items_object);
          }
          items.splice(index, 1);
          to_delete_items.splice(index, 1);
        } else {
          to_insert_items.push(itemInList);

      if (to_insert_items && to_insert_items.length > 0) {
        for (const to_insert_item of to_insert_items) {
          const res = await DataController.insert("po_orders_items", to_insert_item );
          if (res.status) {
            if (to_insert_item.orders_skus_id) {
              const updateOrderItemStatus = await DataController.updateByKey(
                ...
                to_insert_item.orders_skus_id,
                "product_status_id",
                ...
      if (to_update_items && to_update_items.length > 0) {
        for (const to_update_item of to_update_items) {
          const res = await DataController.update(
            ...
            to_update_item.po_order_item_id,
            to_update_item
      if (to_delete_items && to_delete_items.length > 0) {
        for (const to_delete_item of to_delete_items) {
          const itemToDelete = items.find(
            (item) => item.po_order_item_id === to_delete_item
          );
          const res = await DataController._delete(
            ...
            to_delete_item
          );
          if (res.status) {
            if (itemToDelete && itemToDelete.orders_skus_id) {
              const updateOrderItemStatus = await DataController.updateByKey(
                ...
                itemToDelete.orders_skus_id,
                "product_status_id",
                1
              );