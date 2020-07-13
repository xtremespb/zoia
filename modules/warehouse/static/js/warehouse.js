/* eslint no-undef: 0 */
/* eslint no-use-before-define: 0 */
/* eslint max-len: 0 */

(() => {
    let deleteDialog;
    let deletePropertyDialog;
    let deleteVariantDialog;
    let deleteOrderDialog;
    let deleteCollectionDialog;
    let deleteVariantCollectionDialog;
    let foldersDialog;
    let folderEditDialog;
    let repairDialog;
    let imagesDialog;
    let settingsDialog;
    let propertiesListDialog;
    let variantsListDialog;
    let variantCollectionSelectDialog;
    let propertiesSelectDialog;
    let collectionsListDialog;
    let variantsCollectionsListDialog;
    let propertyEditDialog;
    let variantEditDialog;
    let collectionEditDialog;
    let variantCollectionEditDialog;
    let propertySelectDialog;
    let variantSelectDialog;
    let variantsSelectDialog;
    let collectionSelectDialog;
    let propertiesImportDialog;
    let collectionsImportDialog;
    let variantsImportDialog;
    let addressAddEditDialog;
    let addressEditDialog;
    let deliveryEditDialog;
    let deliveryDialog;
    let orderDialog;
    let orderAddOptionsDialog;
    let currentEditID;
    let currentDeleteID;
    let foldersTree;
    let repairTree;
    let foldersModified = false;
    let foldersEditMode = false;
    let editShadow = {};
    let editLanguage;
    let editMode;
    let currentAddressData;
    let ordersItemCacheData = {};

    let locale;
    let corePrefix;
    let langs;
    let foldersData;
    let addressData;
    let addressJSON;
    let settings;
    let settingsData;
    let uprefix;

    const getUrlParam = (sParam) => {
        let sPageURL = decodeURIComponent(window.location.search.substring(1));
        let sURLVariables = sPageURL.split('&');
        let sParameterName;
        let i;
        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    const initFoldersTree = (data) => {
        if (foldersTree) {
            foldersTree.jstree(true).destroy();
        }
        foldersTree = $('#zoia_folders_tree').jstree({
            core: {
                check_callback: true,
                data: data || foldersData
            },
            plugins: ['dnd', 'unique', 'types'],
            types: {
                '#': {
                    max_children: 1,
                    valid_children: ['root']
                },
                'root': {
                    valid_children: ['folder']
                },
                'folder': {
                    valid_children: ['folder']
                }
            }
        });
        foldersTree.on('loaded.jstree', () => {
            foldersTree.jstree(true).open_all('#');
            treeFindRoot(foldersTree);
        });
        foldersTree.on('changed.jstree', (e, _data) => {
            foldersChangedHandler(e, _data);
        });
    };

    const initRepairTree = () => {
        if (repairTree) {
            repairTree.jstree(true).destroy();
        }
        repairTree = $('#zoia_repair_tree').jstree({
            core: {
                check_callback: true,
                data: foldersData
            },
            plugins: ['dnd', 'unique', 'types'],
            types: {
                '#': {
                    max_children: 1,
                    valid_children: ['root']
                },
                'root': {
                    valid_children: ['folder']
                },
                'folder': {
                    valid_children: ['folder']
                }
            }
        });
        repairTree.on('loaded.jstree', () => {
            repairTree.jstree(true).open_all('#');
            treeFindRoot(repairTree);
        });
        repairTree.on('changed.jstree', (e, _data) => {
            repairChangedHandler(e, _data);
        });
    };

    const initCKEditor = () => {
        window.setTimeout(function() {
            const ckeditor = $('#editForm_content').ckeditor({
                filebrowserImageBrowseUrl: uprefix + uprefix + corePrefix.admin + '/warehouse/browse',
                filebrowserBrowseUrl: uprefix + uprefix + corePrefix.admin + '/warehouse/browse',
                filebrowserWindowWidth: 800,
                filebrowserWindowHeight: 500,
                allowedContent: true
            }).editor;
            ckeditor.on('instanceReady', function() {
                $(window).bind('popstate',
                    (event) => {
                        processState(event.originalEvent.state);
                    });
                processState();
            });
        }, 0);
    };

    const initShifty = () => {
        $('.warehouse-image-item').shifty({
            className: 'warehouse-image-item-selected',
            select: function() {
                const selection = $('#imagesList').getSelected('warehouse-image-item-selected');
                if (selection.length) {
                    $('#imagesListBtnDel').show();
                } else {
                    $('#imagesListBtnDel').hide();
                }
            },
            unselect: function() {}
        });
    };

    const treeFindRoot = (tree) => {
        const fldrs = foldersTree.jstree(true).get_json(tree, {
            flat: true,
            no_state: true,
            no_id: false,
            no_data: false
        });
        tree.jstree(true).deselect_all();
        for (let i = 0; i < fldrs.length; i++) {
            if (fldrs[i].parent === '#') {
                tree.jstree(true).select_node(fldrs[i].id);
            }
        }
    };

    const serializeFolders = () => {
        let result = foldersTree.jstree(true).get_json(foldersTree, {
            flat: true,
            no_state: true,
            no_id: false,
            no_data: false
        });
        for (let i in result) {
            delete result[i].li_attr;
            delete result[i].a_attr;
            delete result[i].icon;
            delete result[i].state;
        }
        return result;
    };

    const onSelectedFolder = (sel, path) => {
        foldersDialog.hide();
        $('#editForm_folder_val').attr('data', foldersTree.jstree(true).get_node(sel).id);
        $('#editForm_folder_val').html(path);
        // foldersTree.jstree(true).get_node(sel).id;
    };

    const treePath = (tree, id, _path) => {
        let node = tree.find(x => x.id === id);
        if (!node) {
            return '';
        }
        let path = _path || [];
        path.push(node.text);
        if (node.parent !== '#') {
            path = treePath(tree, node.parent, path);
        }
        return path;
    };

    const editSpinner = (show) => {
        if (show) {
            $('.editForm-form-button').hide();
            $('#zoiaEditSpinner').show();
        } else {
            $('.editForm-form-button').show();
            $('#zoiaEditSpinner').hide();
        }
    };

    const deleteDialogSpinner = (show) => {
        if (show) {
            $('.zoia-delete-dialog-button').hide();
            $('#zoiaDeleteDialogSpinner').show();
        } else {
            $('.zoia-delete-dialog-button').show();
            $('#zoiaDeleteDialogSpinner').hide();
        }
    };

    const deletePropertyDialogSpinner = (show) => {
        if (show) {
            $('.zoia-deleteproperty-dialog-button').hide();
            $('#zoiaDeletePropertyDialogSpinner').show();
        } else {
            $('.zoia-deleteproperty-dialog-button').show();
            $('#zoiaDeletePropertyDialogSpinner').hide();
        }
    };

    const deleteVariantDialogSpinner = (show) => {
        if (show) {
            $('.zoia-deletevariant-dialog-button').hide();
            $('#zoiaDeleteVariantDialogSpinner').show();
        } else {
            $('.zoia-deletevariant-dialog-button').show();
            $('#zoiaDeleteVariantDialogSpinner').hide();
        }
    };

    const deleteOrderDialogSpinner = (show) => {
        if (show) {
            $('.zoia-deleteorder-dialog-button').hide();
            $('#zoiaDeleteOrderDialogSpinner').show();
        } else {
            $('.zoia-deleteorder-dialog-button').show();
            $('#zoiaDeleteOrderDialogSpinner').hide();
        }
    };

    const deleteCollectionDialogSpinner = (show) => {
        if (show) {
            $('.zoia-deletecollection-dialog-button').hide();
            $('#zoiaDeleteCollectionDialogSpinner').show();
        } else {
            $('.zoia-deletecollection-dialog-button').show();
            $('#zoiaDeleteCollectionDialogSpinner').hide();
        }
    };

    const deleteVariantCollectionDialogSpinner = (show) => {
        if (show) {
            $('.zoia-deletevariantcollection-dialog-button').hide();
            $('#zoiaDeleteVariantCollectionDialogSpinner').show();
        } else {
            $('.zoia-deletevariantcollection-dialog-button').show();
            $('#zoiaDeleteVariantCollectionDialogSpinner').hide();
        }
    };

    const foldersDialogSpinner = (show) => {
        if (show) {
            $('.zoia-folders-dialog-button').hide();
            $('#zoiaFoldersDialogSpinner').show();
        } else {
            $('.zoia-folders-dialog-button').show();
            $('#zoiaFoldersDialogSpinner').hide();
        }
    };

    const repairDialogSpinner = (show) => {
        if (show) {
            $('.zoia-repair-dialog-button').hide();
            $('#zoiaRepairDialogSpinner').show();
        } else {
            $('.zoia-repair-dialog-button').show();
            $('#zoiaRepairDialogSpinner').hide();
        }
    };

    const createItem = () => {
        editMode = false;
        $('#zoiaSpinnerMain').show();
        $.ajax({
            type: 'GET',
            url: '/api/warehouse/create',
            cache: false
        }).done((res) => {
            $('#zoiaSpinnerMain').hide();
            if (res && res.status === 1 && res.id) {
                currentEditID = res.id;
                $('#wrapTable').hide();
                $('#zoiaEdit').show();
                $('#zoiaEditHeader').html(lang.addItem);
                for (let lng in langs) {
                    editShadow[lng] = {
                        enabled: true,
                        data: {}
                    };
                }
                $('#editForm').zoiaFormBuilder().resetForm();
                editLanguage = Object.keys(langs)[0];
                markZoiaLanguagesTab(editLanguage);
                $('#editForm_content').val('');
                $('#imagesList').html('');
                $('#editForm_images_val').html('0');
                $('#imagesListBtnDel').hide();
            } else {
                $('#zoiaEdit').hide();
                $('#wrapTable').show();
                $zUI.notification(lang['Could not create new item'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaSpinnerMain').hide();
            $('#zoiaEdit').hide();
            $('#wrapTable').show();
            $zUI.notification(lang['Could not create new item'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const editItem = (id) => {
        editMode = true;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return showTable();
        }
        currentEditID = id;
        for (let lng in langs) {
            editShadow[lng] = {
                enabled: true,
                data: {}
            };
        }
        $('#wrapTable').hide();
        $('#editForm').zoiaFormBuilder().resetForm();
        $('#zoiaEditHeader').html(lang.editItem);
        editLanguage = Object.keys(langs)[0];
        markZoiaLanguagesTab(editLanguage);
        $('#zoiaSpinnerMain').show();
        $('#editForm').zoiaFormBuilder().loadData({ id: id });
    };

    const editOrder = (id) => {
        editMode = true;
        if (!id || typeof id !== 'string' || !id.match(/^[0-9]+$/)) {
            return;
        }
        currentEditID = id;
        $('#zoiaOrderDialogBody').hide();
        $('#zoiaOrderDialogBodySpinner').show();
        $('#zoiaOrderDialogButtons').hide();
        $('.za-catalog-order-id').html(id);
        orderDialog.show();
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/orders/load',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            $('#zoiaSpinnerMain').hide();
            if (res && res.status === 1) {
                currentAddressData = res.addressData;
                $('#zoiaOrderDialogButtons').show();
                $('#za_catalog_order_tabs').find('li:first').click();
                // Clean up data
                $('#za_catalog_order_cart_wrap').html('');
                $('#za_catalog_order_costs_wrap').html('');
                $('.za-catalog-order-form-rx').val('');
                $('.za-catalog-order-form-rx').prop('selectedIndex', 0);
                // Fill data
                const date = parseInt(res.item.date, 10) * 1000;
                $('#za_catalog_order_date').html(new Date(date).toLocaleString());
                $('#za_catalog_order_date').attr('data', res.item.date);
                $('#za_catalog_order_status').val(res.item.status);
                $('#za_catalog_order_cost_delivery').val(res.item.costs.delivery);
                $('#za_catalog_order_cost_wares').val(res.item.costs.totalWares);
                $('#za_catalog_order_cost_total').val(res.item.costs.total);
                $('#za_catalog_order_username').val(res.item.username || '');
                $('#za_catalog_order_email').val(res.item.email || '');
                $('#za_catalog_order_phone').val(res.item.phone || '');
                $('#za_catalog_order_tracking').val(res.item.tracking || '');
                $('#za_catalog_order_paid').prop('checked', res.item.paid);
                $('#za_catalog_order_delivery').val(res.item.delivery);
                let cartHTML = '<table class="za-table za-table-striped za-table-hover za-table-small za-table-middle za-table-responsive" id="za_catalog_order_cart_table"><tbody>';
                for (let i in res.item.cart) {
                    const [cid, variant] = i.split('|');
                    let extraHTML = '';
                    for (let c in res.item.cart[i].checkboxes) {
                        if (res.propertiesData[res.item.cart[i].checkboxes[c]]) {
                            extraHTML += '<br>' + res.propertiesData[res.item.cart[i].checkboxes[c]];
                        }
                    }
                    for (let c in res.item.cart[i].integers) {
                        const [iid, cnt] = res.item.cart[i].integers[c].split('|');
                        if (res.propertiesData[iid]) {
                            extraHTML += '<br>' + res.propertiesData[iid] + '&nbsp;(' + cnt + ')';
                        }
                    }
                    for (let c in res.item.cart[i].selects) {
                        const [sid, cnt] = res.item.cart[i].selects[c].split('|');
                        if (res.propertiesData[sid]) {
                            const [title, valuesStr] = res.propertiesData[sid].split('|');
                            const values = valuesStr.split(',');
                            extraHTML += '<br>' + title + ':&nbsp;' + values[cnt];
                        }
                    }
                    cartHTML += '<tr><td class="za-table-shrink" data-variant="' + i + '" data-checkboxes="' + res.item.cart[i].checkboxes + '" data-integers="' + res.item.cart[i].integers + '" data-selects="' + res.item.cart[i].selects + '">' + cid + '</td><td class="za-table-expand">' + res.cartData[cid] + (variant ? '&nbsp;(' + res.variants[variant] + ')' : '') + extraHTML + '</td><td class="za-table-shrink"><input class="za-input za-form-width-xsmall" value="' + res.item.cart[i].count + '"></td><td class="za-table-shrink"><div style="height:20px"><span za-icon="icon:trash;ratio:0.8" class="za-catalog-cart-del"></span></div></td></tr>';
                }
                cartHTML += '</tbody></table>';
                $('#za_catalog_order_cart_wrap').html(cartHTML);
                let costsHTML = '<table class="za-table za-table-striped za-table-hover za-table-small za-table-middle za-table-responsive" id="za_catalog_order_costs_table"><tbody>';
                for (let i in res.item.costs.extra) {
                    costsHTML += '<tr><td class="za-table-expand" data="' + i + '">' + res.addressData[i] + '</td><td class="za-table-shrink"><input class="za-input za-form-width-xsmall" value="' + res.item.costs.extra[i] + '" style="width:100px"></td><td class="za-table-shrink"><div style="height:20px"><span za-icon="icon:trash;ratio:0.8" class="za-catalog-cost-del"></span></div></td></tr>';
                }
                costsHTML += '</tbody></table>';
                $('#za_catalog_order_costs_wrap').html(costsHTML);
                $('.za-catalog-cart-del').unbind().click(function() {
                    $(this).parent().parent().parent().remove();
                });
                $('.za-catalog-cost-del').unbind().click(function() {
                    $(this).parent().parent().parent().remove();
                });
                for (let i in res.item.address) {
                    $('#za_catalog_order_form_' + i).val(res.item.address[i]);
                }
                // Show form
                $('#zoiaOrderDialogBodySpinner').hide();
                $('#zoiaOrderDialogBody').show();
            } else {
                orderDialog.hide();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            orderDialog.hide();
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const createProperty = () => {
        editMode = false;
        propertyEditDialog.show();
        currentEditID = null;
        $('#editPropertyForm').zoiaFormBuilder().resetForm();
        $('#zoiaPropertyEditDialogHeader').html(lang.addItem);
    };

    const createVariant = () => {
        editMode = false;
        variantEditDialog.show();
        currentEditID = null;
        $('#editVariantForm').zoiaFormBuilder().resetForm();
        $('#zoiaVariantEditDialogHeader').html(lang.addItem);
    };

    const editProperty = (id) => {
        editMode = true;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return;
        }
        currentEditID = id;
        $('.zoiaPropertyEditDialogSpinner').show();
        $('.zoiaPropertyEditDialogWrap').hide();
        propertyEditDialog.show();
        $('#editPropertyForm').zoiaFormBuilder().resetForm();
        $('#zoiaPropertyEditDialogHeader').html(lang.editItem);
        $('#editPropertyForm').zoiaFormBuilder().loadData({ id: id });
    };

    const editVariant = (id) => {
        editMode = true;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return;
        }
        currentEditID = id;
        $('.zoiaVariantEditDialogSpinner').show();
        $('.zoiaVariantEditDialogWrap').hide();
        variantEditDialog.show();
        $('#editVariantForm').zoiaFormBuilder().resetForm();
        $('#zoiaVariantEditDialogHeader').html(lang.editItem);
        $('#editVariantForm').zoiaFormBuilder().loadData({ id: id });
    };

    const createDelivery = () => {
        editMode = false;
        deliveryEditDialog.show();
        currentEditID = null;
        $('#editDeliveryForm').zoiaFormBuilder().resetForm();
        $('#zoiaDeliveryEditDialogHeader').html(lang.addItem);
    };

    const editDelivery = (id) => {
        editMode = true;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return;
        }
        currentEditID = id;
        $('.zoiaDeliveryEditDialogSpinner').show();
        $('.zoiaDeliveryEditDialogWrap').hide();
        deliveryEditDialog.show();
        $('#editDeliveryForm').zoiaFormBuilder().resetForm();
        $('#zoiaDeliveryEditDialogHeader').html(lang.editItem);
        $('#editDeliveryForm').zoiaFormBuilder().loadData({ id: id });
    };

    const createVariantCollection = () => {
        editMode = false;
        variantCollectionEditDialog.show();
        currentEditID = null;
        $('#editVariantCollectionForm').zoiaFormBuilder().resetForm();
        $('.variantCollectionFormDataItems').html('');
        $('#zoiaVariantCollectionEditDialogHeader').html(lang.addItem);
        $('.editVariantCollectionForm-title-item-val').first().focus();
    };

    const createCollection = () => {
        editMode = false;
        collectionEditDialog.show();
        currentEditID = null;
        $('#editCollectionForm').zoiaFormBuilder().resetForm();
        $('.collectionFormDataItems').html('');
        $('#zoiaCollectionEditDialogHeader').html(lang.addItem);
        $('.editCollectionForm-title-item-val').first().focus();
    };

    const editCollection = (id) => {
        editMode = true;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return;
        }
        currentEditID = id;
        $('.zoiaCollectionEditDialogSpinner').show();
        $('.zoiaCollectionEditDialogWrap').hide();
        collectionEditDialog.show();
        $('#editCollectionForm').zoiaFormBuilder().resetForm();
        $('.collectionFormDataItems').html('');
        $('#zoiaCollectionEditDialogHeader').html(lang.editItem);
        $('#editCollectionForm').zoiaFormBuilder().loadData({ id: id });
    };

    const editVariantCollection = (id) => {
        editMode = true;
        if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9]{24}$/)) {
            return;
        }
        currentEditID = id;
        $('.zoiaVariantCollectionEditDialogSpinner').show();
        $('.zoiaVariantCollectionEditDialogWrap').hide();
        variantCollectionEditDialog.show();
        $('#editVariantCollectionForm').zoiaFormBuilder().resetForm();
        $('.variantCollectionFormDataItems').html('');
        $('#zoiaVariantCollectionEditDialogHeader').html(lang.editItem);
        $('#editVariantCollectionForm').zoiaFormBuilder().loadData({ id: id });
    };

    const showTable = () => {
        $('#wrapTable').show();
        $('#zoiaEdit').hide();
    };

    const deleteItem = (id) => {
        if (!id) {
            return showTable();
        }
        let items = [];
        let skus = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                skus.push($('#warehouse').zoiaTable().getCurrentData()[id[i]].title);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            skus.push($('#warehouse').zoiaTable().getCurrentData()[id].title);
        }
        $('#zoiaDeleteDialogList').html('');
        for (let n in skus) {
            $('#zoiaDeleteDialogList').append('<li>' + skus[n] + '</li>');
        }
        deleteDialogSpinner(false);
        deleteDialog.show();
    };

    const deleteProperty = (id) => {
        if (!id) {
            return;
        }
        let items = [];
        let ids = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                ids.push($('#properties').zoiaTable().getCurrentData()[id[i]].title);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            ids.push($('#properties').zoiaTable().getCurrentData()[id].title);
        }
        $('#zoiaDeletePropertyDialogList').html('');
        for (let n in ids) {
            $('#zoiaDeletePropertyDialogList').append('<li>' + ids[n] + '</li>');
        }
        deletePropertyDialogSpinner(false);
        deletePropertyDialog.show();
    };

    const deleteVariant = (id) => {
        if (!id) {
            return;
        }
        let items = [];
        let ids = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                ids.push($('#variants').zoiaTable().getCurrentData()[id[i]].title);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            ids.push($('#variants').zoiaTable().getCurrentData()[id].title);
        }
        $('#zoiaDeleteVariantDialogList').html('');
        for (let n in ids) {
            $('#zoiaDeleteVariantDialogList').append('<li>' + ids[n] + '</li>');
        }
        deleteVariantDialogSpinner(false);
        deleteVariantDialog.show();
    };

    const deleteOrder = (id) => {
        if (!id) {
            return;
        }
        let items = [];
        let ids = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                ids.push($('#orders').zoiaTable().getCurrentData()[id[i]]._id);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            ids.push($('#orders').zoiaTable().getCurrentData()[id]._id);
        }
        $('#zoiaDeleteOrderDialogList').html('');
        for (let n in ids) {
            $('#zoiaDeleteOrderDialogList').append('<li>' + ids[n] + '</li>');
        }
        deleteOrderDialogSpinner(false);
        deleteOrderDialog.show();
    };

    const deleteCollection = (id) => {
        if (!id) {
            return;
        }
        let items = [];
        let ids = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                ids.push($('#collections').zoiaTable().getCurrentData()[id[i]].title);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            ids.push($('#collections').zoiaTable().getCurrentData()[id].title);
        }
        $('#zoiaDeleteCollectionDialogList').html('');
        for (let n in ids) {
            $('#zoiaDeleteCollectionDialogList').append('<li>' + ids[n] + '</li>');
        }
        deleteCollectionDialogSpinner(false);
        deleteCollectionDialog.show();
    };

    const deleteVariantCollection = (id) => {
        if (!id) {
            return;
        }
        let items = [];
        let ids = [];
        currentDeleteID = [];
        if (typeof id === 'object') {
            items = id;
            currentDeleteID = id;
            for (let i in id) {
                ids.push($('#variantscollections').zoiaTable().getCurrentData()[id[i]].title);
            }
        } else {
            items.push(id);
            currentDeleteID.push(id);
            ids.push($('#variantscollections').zoiaTable().getCurrentData()[id].title);
        }
        $('#zoiaDeleteVariantCollectionDialogList').html('');
        for (let n in ids) {
            $('#zoiaDeleteVariantCollectionDialogList').append('<li>' + ids[n] + '</li>');
        }
        deleteVariantCollectionDialogSpinner(false);
        deleteVariantCollectionDialog.show();
    };

    const ajaxDeleteItem = () => {
        deleteDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/delete',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#warehouse').zoiaTable().load();
            if (res && res.status === 1) {
                deleteDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deleteDialogSpinner(false);
            }
        }).fail(() => {
            $('#warehouse').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteDialogSpinner(false);
        });
    };

    const ajaxDeleteOrder = () => {
        deleteOrderDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/orders/delete',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#orders').zoiaTable().load();
            if (res && res.status === 1) {
                deleteOrderDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deleteOrderDialogSpinner(false);
            }
        }).fail(() => {
            $('#orders').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteOrderDialogSpinner(false);
        });
    };

    const ajaxDeleteProperty = () => {
        deletePropertyDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/delete/property',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#properties').zoiaTable().load();
            if (res && res.status === 1) {
                deletePropertyDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deletePropertyDialogSpinner(false);
            }
        }).fail(() => {
            $('#properties').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deletePropertyDialogSpinner(false);
        });
    };

    const ajaxDeleteVariant = () => {
        deleteVariantDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/delete/variant',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#variants').zoiaTable().load();
            if (res && res.status === 1) {
                deleteVariantDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deleteVariantDialogSpinner(false);
            }
        }).fail(() => {
            $('#properties').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteVariantDialogSpinner(false);
        });
    };

    const ajaxDeleteCollection = () => {
        deleteCollectionDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/delete/collection',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#collections').zoiaTable().load();
            if (res && res.status === 1) {
                deleteCollectionDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deleteCollectionDialogSpinner(false);
            }
        }).fail(() => {
            $('#collections').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteCollectionDialogSpinner(false);
        });
    };

    const ajaxDeleteVariantCollection = () => {
        deleteVariantCollectionDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/delete/variantcollection',
            data: {
                id: currentDeleteID
            },
            cache: false
        }).done((res) => {
            $('#variantscollections').zoiaTable().load();
            if (res && res.status === 1) {
                deleteVariantCollectionDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
                deleteVariantCollectionDialogSpinner(false);
            }
        }).fail(() => {
            $('#variantscollections').zoiaTable().load();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            deleteVariantCollectionDialogSpinner(false);
        });
    };

    const ajaxRepairDatabase = () => {
        repairDialogSpinner(true);
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/repair',
            data: {
                folder: repairTree.jstree(true).get_selected()
            },
            cache: false
        }).done((res) => {
            repairDialogSpinner(false);
            $('#warehouse').zoiaTable().load();
            if (res && res.status === 1) {
                repairDialog.hide();
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot repair one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#warehouse').zoiaTable().load();
            $zUI.notification(lang['Cannot repair one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            repairDialogSpinner(false);
        });
    };

    const ajaxRebuildDatabase = () => {
        $('#zoiaSpinnerMain').show();
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/rebuild',
            cache: false
        }).done((res) => {
            $('#zoiaSpinnerMain').hide();
            $('#warehouse').zoiaTable().load();
            if (res && res.status === 1) {
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot rebuild one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#warehouse').zoiaTable().load();
            $zUI.notification(lang['Cannot rebuild one or more items'], {
                status: 'danger',
                timeout: 1500
            });
            $('#zoiaSpinnerMain').hide();
        });
    };

    const processState = (eventState) => {
        const state = eventState || {
            action: getUrlParam('action'),
            id: getUrlParam('id')
        };
        switch (state.action) {
            case 'edit':
                editItem(state.id);
                break;
            case 'create':
                createItem();
                break;
            default:
                showTable();
                break;
        }
    };

    const syncEditFormProperties = (clng) => {
        let dolly = editShadow[clng].data.properties.value || {};
        for (let lng in langs) {
            if (lng !== clng && editShadow[lng].enabled) {
                let save = {};
                if (!editShadow[lng].data.properties) {
                    editShadow[lng].data.properties = {};
                }
                for (let i in editShadow[lng].data.properties.value) {
                    save[editShadow[lng].data.properties.value[i].d] = editShadow[lng].data.properties.value[i].v;
                }
                editShadow[lng].data.properties.value = jQuery.extend(true, {}, dolly);
                for (let i in editShadow[lng].data.properties.value) {
                    editShadow[lng].data.properties.value[i].v = save[editShadow[lng].data.properties.value[i].d] || '';
                }
            }
        }
        dolly = editShadow[clng].data.variants.value || {};
        for (let lng in langs) {
            if (lng !== clng && editShadow[lng].enabled) {
                let save = {};
                if (!editShadow[lng].data.variants) {
                    editShadow[lng].data.variants = {};
                }
                for (let i in editShadow[lng].data.variants.value) {
                    save[editShadow[lng].data.variants.value[i].d] = editShadow[lng].data.variants.value[i].v;
                }
                editShadow[lng].data.variants.value = jQuery.extend(true, {}, dolly);
                for (let i in editShadow[lng].data.variants.value) {
                    editShadow[lng].data.variants.value[i].v = save[editShadow[lng].data.variants.value[i].d] || '';
                }
            }
        }
    };

    const syncEditFormPropertiesFirst = () => {
        let clng;
        for (let lng in langs) {
            if (lng !== editLanguage && editShadow[lng].enabled) {
                clng = lng;
                break;
            }
        }
        if (!clng) {
            return;
        }
        let dolly = editShadow[clng].data.properties.value || {};
        editShadow[editLanguage].data.properties = {
            type: 'valueslisteditable'
        };
        editShadow[editLanguage].data.properties.value = jQuery.extend(true, {}, dolly);
        for (let i in editShadow[editLanguage].data.properties.value) {
            editShadow[editLanguage].data.properties.value[i].v = '';
        }
        dolly = editShadow[clng].data.variants.value || {};
        editShadow[editLanguage].data.variants = {
            type: 'valueslisteditable'
        };
        editShadow[editLanguage].data.variants.value = jQuery.extend(true, {}, dolly);
    };

    const foldersChangedHandler = (e, data) => {
        $('.zoia-folders-btn').attr('disabled', (data.selected.length ? false : true));
        $('#zoiaFoldersDialogButton').attr('disabled', false);
        if (!data.selected.length || data.selected.length > 1) {
            $('#zoiaFoldersAdd').attr('disabled', true);
            $('#zoiaFoldersEdit').attr('disabled', true);
            $('#zoiaFoldersDialogButton').attr('disabled', true);
        }
        for (let i in data.selected) {
            if (foldersTree.jstree(true).get_parent(data.selected[i]) === '#') {
                $('#zoiaFoldersEdit').attr('disabled', true);
                $('#zoiaFoldersDelete').attr('disabled', true);
            }
        }
    };

    const repairChangedHandler = (e, data) => {
        $('#zoiaRepairDialogButton').attr('disabled', !(data.selected.length && data.selected.length === 1));
    };

    const onEditLanguageCheckboxClickEvent = () => {
        if ($('#zoiaEditLanguageCheckbox').prop('checked')) {
            $('#editForm').zoiaFormBuilder().resetForm();
            editShadow[editLanguage].enabled = true;
            editShadow[editLanguage].data = {};
            syncEditFormPropertiesFirst();
            $('#editForm').zoiaFormBuilder().deserializePart('properties', editShadow[editLanguage].data.properties);
            for (let lng in langs) {
                if (editShadow[lng].data) {
                    if (editShadow[lng].data.folder) {
                        $('#editForm_folder_val').html(editShadow[lng].data.folder.value);
                        $('#editForm_folder_val').attr('data', editShadow[lng].data.folder.id);
                    }
                    if (editShadow[lng].data.sku) {
                        $('#editForm_sku').val(editShadow[lng].data.sku.value);
                    }
                    if (editShadow[lng].data.weight) {
                        $('#editForm_weight').val(editShadow[lng].data.weight.value);
                    }
                    if (editShadow[lng].data.amount) {
                        $('#editForm_amount').val(editShadow[lng].data.amount.value);
                    }
                    if (editShadow[lng].data.images) {
                        $('#editForm_images_val').html(editShadow[lng].data.images.value);
                        $('#editForm_images_val').attr('data', editShadow[lng].data.images.id);
                    }
                    if (editShadow[lng].data.price) {
                        $('#editForm_price').val(editShadow[lng].data.price.value);
                    }
                    if (editShadow[lng].data.status) {
                        $('#editForm_status').val(editShadow[lng].data.status.value);
                    }
                    if (editShadow[lng].data.pinned) {
                        $('#editForm_pinned').val(editShadow[lng].data.pinned.value);
                    }
                    if (editShadow[lng].data.variants) {
                        $('#editForm').zoiaFormBuilder().deserializePart('variants', editShadow[lng].data.variants);
                    }
                }
            }
            $('#editForm_content').val('');
            $('#editForm').show();
        } else {
            editShadow[editLanguage].enabled = false;
            $('#editForm').hide();
        }
    };

    const markZoiaLanguagesTab = (n) => {
        $('#zoiaEditLanguages > li').removeClass('za-active');
        $('#zoiaEditLanguages > li[data=' + n + ']').addClass('za-active');
    };

    const onZoiaEditLanguagesClick = (lng) => {
        if (!editShadow[lng].enabled) {
            editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
            editLanguage = lng;
            $('#zoiaEditLanguageCheckbox').prop('checked', false);
            $('#editForm').hide();
            return;
        }
        $('#zoiaEditLanguageCheckbox').prop('checked', true);
        if (lng === editLanguage) {
            return $('#editForm').zoiaFormBuilder().deserialize(editShadow[editLanguage].data);
        }
        editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
        if (editShadow[editLanguage].enabled && editShadow[editLanguage].data &&
            editShadow[editLanguage].data.folder && editShadow[editLanguage].data.images &&
            editShadow[editLanguage].data.sku && editShadow[editLanguage].data.status &&
            editShadow[editLanguage].data.weight && editShadow[editLanguage].data.amount) {
            let saveFolder = editShadow[editLanguage].data.folder;
            let saveImages = editShadow[editLanguage].data.images;
            let saveSKU = editShadow[editLanguage].data.sku;
            let saveWeight = editShadow[editLanguage].data.weight;
            let saveAmount = editShadow[editLanguage].data.amount;
            let savePrice = editShadow[editLanguage].data.price;
            let saveStatus = editShadow[editLanguage].data.status;
            let saveVariants = editShadow[editLanguage].data.variants;
            let savePinned = editShadow[editLanguage].data.pinned;
            editShadow[lng].data.folder = saveFolder;
            editShadow[lng].data.images = saveImages;
            editShadow[lng].data.sku = saveSKU;
            editShadow[lng].data.weight = saveWeight;
            editShadow[lng].data.amount = saveAmount;
            editShadow[lng].data.price = savePrice;
            editShadow[lng].data.status = saveStatus;
            editShadow[lng].data.variants = saveVariants;
            editShadow[lng].data.pinned = savePinned;
        }
        syncEditFormProperties(editLanguage);
        $('#editForm').zoiaFormBuilder().resetForm();
        $('#editForm').zoiaFormBuilder().deserialize(editShadow[lng].data);
        $('.selectPropertyItemClose').unbind();
        $('.selectPropertyItemClose').click(function() {
            $(this).parent().parent().remove();
        });
        editLanguage = lng;
        markZoiaLanguagesTab(editLanguage);
        $('#editForm').show();
    };

    const generateUploaderList = () => {
        let items = [];
        $('.warehouse-image-item').each(function() {
            items.push({
                id: $(this).attr('data-id'),
                ext: $(this).attr('data-ext')
            });
        });
        return items;
    };

    const initUploader = () => {
        currentUploaderFiles = [];
        uploader = new plupload.Uploader({
            browse_button: 'zoia-upload-area',
            runtimes: 'html5,html4',
            url: '/api/warehouse/upload',
            drop_element: 'zoia-upload-area',
            filters: {
                max_file_size: '100mb'
            }
        });
        uploader.init();
        uploader.bind('FilesAdded', function(up, files) {
            let html = '';
            plupload.each(files, function(file) {
                html += '<div><div class="zoia-upload-files-label">' + file.name + '&nbsp;(' + plupload.formatSize(file.size) + ')</div><progress id="' + file.id + '" class="za-progress" value="0" max="100"></progress></div>';
            });
            $('#zoia-upload-files').html(html);
            $('#zoia-upload-files').show();
            uploader.settings.multipart_params = {
                id: currentEditID
            };
            uploadFailed = false;
            uploader.start();
        });
        uploader.bind('Error', function() {
            $zUI.notification(lang['Cannot upload'] + ': ' + file.name, {
                status: 'danger',
                timeout: 1500
            });
        });
        uploader.bind('UploadProgress', function(up, file) {
            $('#' + file.id).attr('value', file.percent);
        });
        uploader.bind('FileUploaded', function(upldr, file, object) {
            try {
                let res = JSON.parse(object.response);
                if (res.status !== 1) {
                    uploadFailed = true;
                    $zUI.notification(lang['Cannot upload'] + ': ' + file.name, {
                        status: 'danger',
                        timeout: 1500
                    });
                } else {
                    $('#' + file.id).parent().remove();
                    $('#imagesList').append('<div class="za-card za-card-default za-card-body warehouse-image-item" data-id="' + res.id + '" data-ext="' + res.ext + '"><img src="/warehouse/static/images/' + currentEditID + '/tn_' + res.id + '.' + res.ext + '"></div>');
                    initShifty();
                }
            } catch (e) {
                $zUI.notification(lang['Cannot upload'] + ': ' + file.name, {
                    status: 'danger',
                    timeout: 1500
                });
            }
        });
        uploader.bind('UploadComplete', function() {
            $('#zoia-upload-files').hide();
        });
    };

    const imagesDialogCloseHandler = () => {
        const list = generateUploaderList();
        $('#editForm_images_val').attr('data', JSON.stringify(list));
        $('#editForm_images_val').html(list.length);
        imagesDialog.hide();
        $('#zoiaSpinnerMain').show();
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/images/save',
            data: {
                items: list,
                id: currentEditID
            },
            cache: false
        }).done(() => {
            $('#zoiaSpinnerMain').hide();
        }).fail(() => {
            $('#zoiaSpinnerMain').hide();
            $zUI.notification(lang['Cannot save images data'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const deleteButtonHanlder = () => {
        const checked = $('.warehouseCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            deleteItem(checked);
        }
    };

    const deletePropertyButtonHanlder = () => {
        const checked = $('.propertiesCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            deleteProperty(checked);
        }
    };

    const deleteVariantButtonHanlder = () => {
        const checked = $('.variantsCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            deleteVariant(checked);
        }
    };

    const deleteOrderButtonHanlder = () => {
        const checked = $('.ordersCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            deleteOrder(checked);
        }
    };

    const deleteCollectionButtonHanlder = () => {
        const checked = $('.collectionsCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            deleteCollection(checked);
        }
    };

    const deleteVariantCollectionButtonHanlder = () => {
        const checked = $('.variantscollectionsCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            deleteVariantCollection(checked);
        }
    };

    const getEditFolderFormItems = () => {
        let editFolderFormItems = {
            id: {
                type: 'text',
                label: lang['ID'],
                css: 'za-width-medium',
                autofocus: true,
                validation: {
                    mandatoryCreate: true,
                    mandatoryEdit: true,
                    length: {
                        min: 1,
                        max: 64
                    },
                    regexp: /^[A-Za-z0-9_\-]+$/,
                    process: (item) => {
                        return item.trim();
                    }
                }
            }
        };
        for (let lng in langs) {
            editFolderFormItems[lng] = {
                type: 'text',
                label: langs[lng],
                css: 'za-width-large',
                validation: {
                    mandatoryCreate: false,
                    mandatoryEdit: false,
                    length: {
                        min: 1,
                        max: 64
                    },
                    process: (item) => {
                        return item.trim();
                    }
                }
            };
            editShadow[lng] = {
                enabled: true,
                data: {}
            };
            if (!editLanguage) {
                editLanguage = lng;
            }
        }
        editFolderFormItems.buttons = {
            type: 'buttons',
            css: 'za-modal-footer za-text-right',
            buttons: [{
                label: lang['Cancel'],
                css: 'za-button-default za-modal-close'
            }, {
                name: 'btnSave',
                label: lang['Save'],
                css: 'za-button-primary',
                type: 'submit'
            }],
            html: '<div za-spinner style="float:right;display:none" id="zoiaEditDialogSpinner"></div>'
        };
        return editFolderFormItems;
    };

    const getFormLangData = () => {
        let values = [];
        for (let lng in langs) {
            values.push({
                p: lng,
                v: '',
                t: langs[lng]
            });
        }
        return values;
    };

    const initDialogs = () => {
        deleteDialog = $zUI.modal('#zoiaDeleteDialog', {
            bgClose: false,
            escClose: false
        });
        deletePropertyDialog = $zUI.modal('#zoiaDeletePropertyDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        deleteVariantDialog = $zUI.modal('#zoiaDeleteVariantDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        deleteCollectionDialog = $zUI.modal('#zoiaDeleteCollectionDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        deleteVariantCollectionDialog = $zUI.modal('#zoiaDeleteVariantCollectionDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        foldersDialog = $zUI.modal('#zoiaFoldersDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        folderEditDialog = $zUI.modal('#zoiaFolderEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        repairDialog = $zUI.modal('#zoiaRepairDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        imagesDialog = $zUI.modal('#zoiaImagesDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        settingsDialog = $zUI.modal('#zoiaSettingsDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        propertiesListDialog = $zUI.modal('#zoiaPropertiesListDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantsListDialog = $zUI.modal('#zoiaVariantsListDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        propertiesSelectDialog = $zUI.modal('#zoiaPropertiesSelectDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantsSelectDialog = $zUI.modal('#zoiaVariantsSelectDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        propertyEditDialog = $zUI.modal('#zoiaPropertyEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantEditDialog = $zUI.modal('#zoiaVariantEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        collectionsListDialog = $zUI.modal('#zoiaCollectionsListDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantsCollectionsListDialog = $zUI.modal('#zoiaVariantsCollectionsListDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        collectionEditDialog = $zUI.modal('#zoiaCollectionEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantCollectionEditDialog = $zUI.modal('#zoiaVariantCollectionEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        propertySelectDialog = $zUI.modal('#zoiaPropertySelectDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantSelectDialog = $zUI.modal('#zoiaVariantSelectDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        collectionSelectDialog = $zUI.modal('#zoiaCollectionSelectDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantCollectionSelectDialog = $zUI.modal('#zoiaVariantCollectionSelectDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        propertiesImportDialog = $zUI.modal('#zoiaPropertiesImportDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        collectionsImportDialog = $zUI.modal('#zoiaCollectionsImportDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantsCollectionsImportDialog = $zUI.modal('#zoiaVariantsCollectionsImportDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        variantsImportDialog = $zUI.modal('#zoiaVariantsImportDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        deliveryDialog = $zUI.modal('#zoiaDeliveryDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        deliveryEditDialog = $zUI.modal('#zoiaDeliveryEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        addressEditDialog = $zUI.modal('#zoiaAddressEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        addressAddEditDialog = $zUI.modal('#zoiaAddressAddEditDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        deleteOrderDialog = $zUI.modal('#zoiaDeleteOrderDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        orderDialog = $zUI.modal('#zoiaOrderDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
        orderAddOptionsDialog = $zUI.modal('#zoiaOrderAddOptionsDialog', {
            bgClose: false,
            escClose: false,
            stack: true
        });
    };

    const foldersDialogButtonHandler = () => {
        let sel = foldersTree.jstree(true).get_selected();
        if (!sel || !sel.length) {
            return;
        }
        foldersData = serializeFolders();
        let path = treePath(foldersData, sel[0]).reverse().join('/').replace('//', '') || '';
        if (path === '/') {
            path = '';
        }
        if (foldersModified) {
            foldersDialogSpinner(true);
            $.ajax({
                type: 'POST',
                url: '/api/warehouse/folders',
                data: { folders: foldersData },
                cache: false
            }).done((res) => {
                foldersDialogSpinner(false);
                if (res && res.status === 1) {
                    onSelectedFolder(sel, path);
                } else {
                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                foldersDialogSpinner(false);
                $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                    status: 'danger',
                    timeout: 1500
                });
            });
        } else {
            onSelectedFolder(sel, path);
        }
    };

    const imagesListBtnDelHandler = () => {
        const selection = $('#imagesList').find('.warehouse-image-item-selected');
        let items = [];
        selection.each(function() {
            items.push({
                id: $(this).attr('data-id'),
                ext: $(this).attr('data-ext')
            });
        });
        $('#zoiaImagesDialogSpinner').css('height', $('#zoiaImagesDialogBody').height());
        $('#zoiaImagesDialogBody').hide();
        $('#zoiaImagesDialogSpinner').show();
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/images/delete',
            data: {
                items: items,
                id: currentEditID
            },
            cache: false
        }).done((res) => {
            $('#zoiaImagesDialogBody').show();
            $('#zoiaImagesDialogSpinner').hide();
            if (res && res.status === 1) {
                selection.each(function() {
                    $(this).remove();
                });
                if ($('#imagesList').find('.warehouse-image-item-selected').length === 0) {
                    $('#imagesListBtnDel').hide();
                }
                $zUI.notification(lang['Operation was successful'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang['Cannot delete one or more items'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaImagesDialogBody').show();
            $('#zoiaImagesDialogSpinner').hide();
            $zUI.notification(lang['Cannot delete one or more items'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const editFormBtnCancelHandler = () => {
        window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/warehouse');
        if (!editMode) {
            $.ajax({
                type: 'POST',
                url: '/api/warehouse/delete',
                data: {
                    id: currentEditID
                },
                cache: false
            });
        }
        $('#zoiaEdit').hide();
        $('#wrapTable').show();
    };

    const warehouseBtnRepairHandler = () => {
        initRepairTree();
        repairDialog.show();
    };

    const foldersRevertHandler = () => {
        foldersData = { id: 1, text: '/', data: null, parent: '#', type: 'root' };
        foldersModified = true;
        initFoldersTree();
    };

    const foldersEditHanlder = () => {
        let sel = foldersTree.jstree(true).get_selected();
        if (!sel || !sel.length || foldersTree.jstree(true).get_parent(sel) === '#') {
            return;
        }
        $('#editFolderForm').zoiaFormBuilder().resetForm();
        $('#editFolderForm_id').val(foldersTree.jstree(true).get_node(sel).text);
        for (let lng in langs) {
            $('#editFolderForm_' + lng).val(foldersTree.jstree(true).get_node(sel).data.lang[lng] || '');
        }
        folderEditDialog.show();
        $('#editFolderForm_id').focus();
        foldersEditMode = true;
    };

    const foldersDeleteHandler = () => {
        let sel = foldersTree.jstree(true).get_selected();
        if (!sel || !sel.length || foldersTree.jstree(true).get_parent(sel) === '#') {
            return;
        }
        foldersTree.jstree(true).delete_node(sel);
        treeFindRoot(foldersTree);
        foldersModified = true;
    };

    const foldersAddHandler = () => {
        $('#editFolderForm').zoiaFormBuilder().resetForm();
        folderEditDialog.show();
        foldersEditMode = false;
    };

    const editFormFolderBtnHandler = () => {
        foldersDialog.show();
        foldersModified = false;
        treeFindRoot(foldersTree);
    };

    const addHandler = () => {
        window.history.pushState({ action: 'create' }, document.title, uprefix + corePrefix.admin + '/warehouse?action=create');
        createItem();
    };

    const addPropertyHandler = () => {
        createProperty();
    };

    const addVariantHandler = () => {
        createVariant();
    };

    const addCollectionHandler = () => {
        createCollection();
    };

    const addVariantCollectionHandler = () => {
        createVariantCollection();
    };

    const addDeliveryHandler = () => {
        createDelivery();
    };

    const editFormImagesBtnHandler = () => {
        imagesDialog.show();
    };

    const initEditLanguages = () => {
        for (let lng in langs) {
            $('#zoiaEditLanguages').append('<li data="' + lng + '"><a href="#">' + langs[lng] + '</a></li>');
        }
    };

    const warehouseBtnSettingsDialogHandler = () => {
        settingsDialog.show();
        $('#editSettingsForm').zoiaFormBuilder().resetForm();
        $('#editSettingsForm').zoiaFormBuilder().loadJSON(settingsData);
        $('#editSettingsForm_weight_wrap>div:first>div:last>input').focus();
    };

    const warehouseBtnPropertiesListDialogHandler = () => {
        propertiesListDialog.show();
    };

    const warehouseBtnVariantsListDialogHandler = () => {
        variantsListDialog.show();
    };

    const warehouseBtnCollectionsListDialogHandler = () => {
        collectionsListDialog.show();
    };

    const warehouseBtnVariantsCollectionsListDialogHandler = () => {
        variantsCollectionsListDialog.show();
    };

    const editCollectionForm_properties_btnHandler = () => {
        $('#propertyselect').zoiaTable().load();
        propertySelectDialog.show();
    };

    const editVariantCollectionForm_properties_btnHandler = () => {
        $('#variantselect').zoiaTable().load();
        variantSelectDialog.show();
    };

    const addCheckedProperties = (ids) => {
        const data = $('#propertyselect').zoiaTable().getCurrentData();
        let duplicate = false;
        const _duplicateFunc = function(pid) {
            if ($(this).attr('data-pid') === pid) {
                duplicate = true;
            }
        };
        for (let i in ids) {
            const id = ids[i];
            const pid = data[id].pid;
            $('.collectionFormDataItems').children().each(_duplicateFunc);
            if (!duplicate) {
                const title = data[id].title;
                $('.collectionFormDataItems').append('<div class="za-card za-card-default za-card-small za-card-body" data-pid="' + pid + '"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span>' + title + '<button type="button" class="collectionPropertyItemClose" za-close style="float:right"></button></div>');
            }
        }
        $('.collectionPropertyItemClose').unbind();
        $('.collectionPropertyItemClose').click(function() {
            $(this).parent().remove();
        });
        $zUI.notification.closeAll();
        $zUI.notification({ message: duplicate ? lang['One or more items are duplicated'] : lang['Added'], status: duplicate ? 'danger' : 'success', timeout: 1000 });
    };

    const addCheckedVariants = (ids) => {
        const data = $('#variantselect').zoiaTable().getCurrentData();
        let duplicate = false;
        if (typeof ids === 'string') {
            ids = [ids];
        }
        const _duplicateFunc = function() {
            if ($(this).attr('data-pid') === pid) {
                duplicate = true;
            }
        };
        for (let i in ids) {
            const id = ids[i];
            const pid = data[id].pid;
            $('.variantFormDataItems').children().each(_duplicateFunc);
            if (!duplicate) {
                const title = data[id].title;
                $('.variantCollectionFormDataItems').append('<div class="za-card za-card-default za-card-small za-card-body" data-pid="' + pid + '"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span>' + title + '<button type="button" class="variantItemClose" za-close style="float:right"></button></div>');
            }
        }
        $('.variantItemClose').unbind();
        $('.variantItemClose').click(function() {
            $(this).parent().remove();
        });
        $zUI.notification.closeAll();
        $zUI.notification({ message: duplicate ? lang['One or more items are duplicated'] : lang['Added'], status: duplicate ? 'danger' : 'success', timeout: 1000 });
    };

    const selectCheckedProperties = (ids) => {
        const data = $('#propertiesselect').zoiaTable().getCurrentData();
        for (let i in ids) {
            const id = ids[i];
            const pid = data[id].pid;
            const title = data[id].title;
            const type = parseInt(data[id].type, 10);
            if (type > 1) {
                $('#editForm_properties_wrap').append('<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body editForm-properties-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">' + title + '</label><div><div class="za-inline za-form-width-medium"><span class="za-form-icon za-form-icon-flip">' + settings.currency + '</span><input placeholder="' + lang['Value'] + '" type="number" step="0.01" class="za-input za-width-1-1 formBuilder-valueslist-val" value="" data-postfix="' + settings.currency + '" data="' + pid + '"></div></div></div></div>');
            } else {
                $('#editForm_properties_wrap').append('<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body editForm-properties-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">' + title + '</label><input placeholder="' + lang['Value'] + '" type="text" class="za-input za-width-1-1 formBuilder-valueslist-val" value="" data="' + pid + '"></div></div>');
            }
        }
        $('.selectPropertyItemClose').unbind();
        $('.selectPropertyItemClose').click(function() {
            $(this).parent().parent().remove();
        });
        $zUI.notification.closeAll();
        $zUI.notification({ message: lang['Added'], status: 'success', timeout: 1000 });
    };

    const selectCheckedVariants = (ids) => {
        const data = $('#variantsselect').zoiaTable().getCurrentData();
        if (typeof ids === 'string') {
            ids = [ids];
        }
        for (let i in ids) {
            const id = ids[i];
            const pid = data[id].pid;
            const title = data[id].title;
            $('#editForm_variants_wrap').append('<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body editForm-variants-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectVariantItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">' + title + '</label><input placeholder="' + lang['Value'] + '" type="text" class="za-input za-width-1-1 formBuilder-valueslist-val" value="" data="' + pid + '"></div></div>');
        }
        $('.selectVariantItemClose').unbind();
        $('.selectVariantItemClose').click(function() {
            $(this).parent().parent().remove();
        });
        $zUI.notification.closeAll();
        $zUI.notification({ message: lang['Added'], status: 'success', timeout: 1000 });
    };

    const zoiaPropertySelectHandler = () => {
        const checked = $('.propertyselectCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            addCheckedProperties(checked);
        }
        $('.collectionPropertyItemClose').unbind();
        $('.collectionPropertyItemClose').click(function() {
            $(this).parent().remove();
        });
    };

    const zoiaSelectedPropertyAddHandler = () => {
        const checked = $('.propertiesselectCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            selectCheckedProperties(checked);
        }
        $('.selectPropertyItemClose').unbind();
        $('.selectPropertyItemClose').click(function() {
            $(this).parent().parent().remove();
        });
    };

    const zoiaSelectedVariantAddHandler = () => {
        const checked = $('.variantsselectCheckbox:checkbox:checked').map(function() {
            return this.id;
        }).get();
        if (checked && checked.length > 0) {
            selectCheckedVariants(checked);
        }
        $('.selectVariantsItemClose').unbind();
        $('.selectVariantsItemClose').click(function() {
            $(this).parent().parent().remove();
        });
    };

    const selectCheckedCollection = (id) => {
        collectionSelectDialog.hide().then(() => {
            $('#zoiaSpinnerMain').show();
            $.ajax({
                type: 'GET',
                url: '/api/warehouse/load/collection/data',
                data: {
                    id: id
                },
                cache: false
            }).done((res) => {
                $('#zoiaSpinnerMain').hide();
                if (res && res.status === 1 && res.items) {
                    for (let pid in res.items) {
                        if (res.items[pid].type > 1) {
                            $('#editForm_properties_wrap').append('<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body editForm-properties-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">' + res.items[pid].title + '</label><div><div class="za-inline za-form-width-medium"><span class="za-form-icon za-form-icon-flip">' + settings.currency + '</span><input placeholder="' + lang['Value'] + '" type="number" step="0.01" class="za-input za-width-1-1 formBuilder-valueslist-val" value="" data-postfix="' + settings.currency + '" data="' + pid + '"></div></div></div></div>');
                        } else {
                            $('#editForm_properties_wrap').append('<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body editForm-properties-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">' + res.items[pid].title + '</label><input placeholder="' + lang['Value'] + '" type="text" class="za-input za-width-1-1 formBuilder-valueslist-val" value="" data="' + pid + '"></div></div>');
                        }
                    }
                    $('.selectPropertyItemClose').unbind();
                    $('.selectPropertyItemClose').click(function() {
                        $(this).parent().parent().remove();
                    });
                    $(window).scrollTop($('#editForm_properties_widget').offset().top - 100);
                } else {
                    $zUI.notification(lang['Could not load information from database'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                $('#zoiaSpinnerMain').hide();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            });
        });
    };

    const selectCheckedVariantCollection = (id) => {
        variantCollectionSelectDialog.hide().then(() => {
            $('#zoiaSpinnerMain').show();
            $.ajax({
                type: 'GET',
                url: '/api/warehouse/load/variantcollection/data',
                data: {
                    id: id
                },
                cache: false
            }).done((res) => {
                $('#zoiaSpinnerMain').hide();
                if (res && res.status === 1 && res.items) {
                    for (let pid in res.items) {
                        $('#editForm_variants_wrap').append('<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body editForm-variants-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectVariantItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">' + res.items[pid] + '</label><input placeholder="' + lang['Value'] + '" type="text" class="za-input za-width-1-1 formBuilder-valueslist-val" value="" data="' + pid + '"></div></div>');
                    }
                    $('.selectVariantItemClose').unbind();
                    $('.selectVariantItemClose').click(function() {
                        $(this).parent().parent().remove();
                    });
                    $(window).scrollTop($('#editForm_variants_widget').offset().top - 100);
                } else {
                    $zUI.notification(lang['Could not load information from database'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                $('#zoiaSpinnerMain').hide();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            });
        });
    };

    const propertiesImportTaskStateCheck = (id) => {
        $.ajax({
            type: 'GET',
            url: '/api/warehouse/import/properties/state',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1 && res.state) {
                if (res.state === 3 || res.state === 0) {
                    propertiesImportDialog.hide();
                    $('#properties').zoiaTable().load();
                    $('#propertyselect').zoiaTable().load();
                    $('#propertiesselect').zoiaTable().load();
                    $zUI.notification(res.state === 0 ? lang['Could not import'] : lang['Import complete'], {
                        status: res.state === 0 ? 'danger' : 'success',
                        timeout: 1500
                    });
                } else {
                    setTimeout(() => {
                        propertiesImportTaskStateCheck(id);
                    }, 5000);
                }
            } else {
                $('#zoiaPropertiesImportDialogBody').show();
                $('#zoiaPropertiesImportDialogSpinner').hide();
                $('#zoiaPropertiesImportDialogFooter').show();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaPropertiesImportDialogBody').show();
            $('#zoiaPropertiesImportDialogSpinner').hide();
            $('#zoiaPropertiesImportDialogFooter').show();
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const collectionsImportTaskStateCheck = (id) => {
        $.ajax({
            type: 'GET',
            url: '/api/warehouse/import/collections/state',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1 && res.state) {
                if (res.state === 3 || res.state === 0) {
                    collectionsImportDialog.hide();
                    $('#collections').zoiaTable().load();
                    $('#propertyselect').zoiaTable().load();
                    $('#collectionselect').zoiaTable().load();
                    $zUI.notification(res.state === 0 ? lang['Could not import'] : lang['Import complete'], {
                        status: res.state === 0 ? 'danger' : 'success',
                        timeout: 1500
                    });
                } else {
                    setTimeout(() => {
                        collectionsImportTaskStateCheck(id);
                    }, 5000);
                }
            } else {
                $('#zoiaCollectionsImportDialogBody').show();
                $('#zoiaCollectionsImportDialogSpinner').hide();
                $('#zoiaCollectionsImportDialogFooter').show();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaCollectionsImportDialogBody').show();
            $('#zoiaCollectionsImportDialogSpinner').hide();
            $('#zoiaCollectionsImportDialogFooter').show();
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const variantsImportTaskStateCheck = (id) => {
        $.ajax({
            type: 'GET',
            url: '/api/warehouse/import/variants/state',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1 && res.state) {
                if (res.state === 3 || res.state === 0) {
                    variantsImportDialog.hide();
                    $('#variants').zoiaTable().load();
                    $('#variantselect').zoiaTable().load();
                    $('#variantcollectionselect').zoiaTable().load();
                    $zUI.notification(res.state === 0 ? lang['Could not import'] : lang['Import complete'], {
                        status: res.state === 0 ? 'danger' : 'success',
                        timeout: 1500
                    });
                } else {
                    setTimeout(() => {
                        variantsImportTaskStateCheck(id);
                    }, 5000);
                }
            } else {
                $('#zoiaVariantsImportDialogBody').show();
                $('#zoiaVariantsImportDialogSpinner').hide();
                $('#zoiaVariantsImportDialogFooter').show();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaVariantsImportDialogBody').show();
            $('#zoiaVariantsImportDialogSpinner').hide();
            $('#zoiaVariantsImportDialogFooter').show();
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const variantsCollectionsImportTaskStateCheck = (id) => {
        $.ajax({
            type: 'GET',
            url: '/api/warehouse/import/variantscollections/state',
            data: {
                id: id
            },
            cache: false
        }).done((res) => {
            if (res && res.status === 1 && res.state) {
                if (res.state === 3 || res.state === 0) {
                    variantsCollectionsImportDialog.hide();
                    $('#variantscollections').zoiaTable().load();
                    $('#variantselect').zoiaTable().load();
                    $('#variantcollectionselect').zoiaTable().load();
                    $zUI.notification(res.state === 0 ? lang['Could not import'] : lang['Import complete'], {
                        status: res.state === 0 ? 'danger' : 'success',
                        timeout: 1500
                    });
                } else {
                    setTimeout(() => {
                        variantsCollectionsImportTaskStateCheck(id);
                    }, 5000);
                }
            } else {
                $('#zoiaVariantsCollectionsImportDialogBody').show();
                $('#zoiaVariantsCollectionsImportDialogSpinner').hide();
                $('#zoiaVariantsCollectionsImportDialogFooter').show();
                $zUI.notification(lang['Could not load information from database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaVariantsCollectionsImportDialogBody').show();
            $('#zoiaVariantsCollectionsImportDialogSpinner').hide();
            $('#zoiaVariantsCollectionsImportDialogFooter').show();
            $zUI.notification(lang['Could not load information from database'], {
                status: 'danger',
                timeout: 1500
            });
        });
    };

    const initImportPropertiesUploader = () => {
        const pimport_bar = document.getElementById('pimport_progressbar');
        $zUI.upload('.pimport-upload', {
            url: '/api/warehouse/import/properties',
            multiple: false,
            error: function() {
                $zUI.notification(lang['Could not upload file'], {
                    status: 'danger',
                    timeout: 1500
                });
            },
            loadStart: function(e) {
                pimport_bar.removeAttribute('hidden');
                pimport_bar.max = e.total;
                pimport_bar.value = e.loaded;
            },
            progress: function(e) {
                pimport_bar.max = e.total;
                pimport_bar.value = e.loaded;
            },
            loadEnd: function(e) {
                pimport_bar.max = e.total;
                pimport_bar.value = e.loaded;
            },
            completeAll: function() {
                setTimeout(function() {
                    pimport_bar.setAttribute('hidden', 'hidden');
                }, 1000);
                let response = {};
                try {
                    response = JSON.parse(arguments[0].response);
                } catch (e) {
                    // Ignore
                }
                if (response.uid) {
                    $('#zoiaPropertiesImportDialogBody').hide();
                    $('#zoiaPropertiesImportDialogSpinner').show();
                    $('#zoiaPropertiesImportDialogFooter').hide();
                    setTimeout(() => {
                        propertiesImportTaskStateCheck(response.uid);
                    }, 5000);
                } else {
                    $zUI.notification(lang['Could not upload file'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }
        });
    };

    const initImportCollectionsUploader = () => {
        const cimport_bar = document.getElementById('cimport_progressbar');
        $zUI.upload('.cimport-upload', {
            url: '/api/warehouse/import/collections',
            multiple: false,
            error: function() {
                $zUI.notification(lang['Could not upload file'], {
                    status: 'danger',
                    timeout: 1500
                });
            },
            loadStart: function(e) {
                cimport_bar.removeAttribute('hidden');
                cimport_bar.max = e.total;
                cimport_bar.value = e.loaded;
            },
            progress: function(e) {
                cimport_bar.max = e.total;
                cimport_bar.value = e.loaded;
            },
            loadEnd: function(e) {
                cimport_bar.max = e.total;
                cimport_bar.value = e.loaded;
            },
            completeAll: function() {
                setTimeout(function() {
                    cimport_bar.setAttribute('hidden', 'hidden');
                }, 1000);
                let response = {};
                try {
                    response = JSON.parse(arguments[0].response);
                } catch (e) {
                    // Ignore
                }
                if (response.uid) {
                    $('#zoiaCollectionsImportDialogBody').hide();
                    $('#zoiaCollectionsImportDialogSpinner').show();
                    $('#zoiaCollectionsImportDialogFooter').hide();
                    setTimeout(() => {
                        collectionsImportTaskStateCheck(response.uid);
                    }, 5000);
                } else {
                    $zUI.notification(lang['Could not upload file'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }
        });
    };

    const initImportVariantsUploader = () => {
        const vimport_bar = document.getElementById('vimport_progressbar');
        $zUI.upload('.vimport-upload', {
            url: '/api/warehouse/import/variants',
            multiple: false,
            error: function() {
                $zUI.notification(lang['Could not upload file'], {
                    status: 'danger',
                    timeout: 1500
                });
            },
            loadStart: function(e) {
                vimport_bar.removeAttribute('hidden');
                vimport_bar.max = e.total;
                vimport_bar.value = e.loaded;
            },
            progress: function(e) {
                vimport_bar.max = e.total;
                vimport_bar.value = e.loaded;
            },
            loadEnd: function(e) {
                vimport_bar.max = e.total;
                vimport_bar.value = e.loaded;
            },
            completeAll: function() {
                setTimeout(function() {
                    vimport_bar.setAttribute('hidden', 'hidden');
                }, 1000);
                let response = {};
                try {
                    response = JSON.parse(arguments[0].response);
                } catch (e) {
                    // Ignore
                }
                if (response.uid) {
                    $('#zoiaVariantsImportDialogBody').hide();
                    $('#zoiaVariantsImportDialogSpinner').show();
                    $('#zoiaVariantsImportDialogFooter').hide();
                    setTimeout(() => {
                        variantsImportTaskStateCheck(response.uid);
                    }, 5000);
                } else {
                    $zUI.notification(lang['Could not upload file'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }
        });
    };

    const initImportVariantsCollectionsUploader = () => {
        const vcimport_bar = document.getElementById('vcimport_progressbar');
        $zUI.upload('.vcimport-upload', {
            url: '/api/warehouse/import/variantscollections',
            multiple: false,
            error: function() {
                $zUI.notification(lang['Could not upload file'], {
                    status: 'danger',
                    timeout: 1500
                });
            },
            loadStart: function(e) {
                vcimport_bar.removeAttribute('hidden');
                vcimport_bar.max = e.total;
                vcimport_bar.value = e.loaded;
            },
            progress: function(e) {
                vcimport_bar.max = e.total;
                vcimport_bar.value = e.loaded;
            },
            loadEnd: function(e) {
                vcimport_bar.max = e.total;
                vcimport_bar.value = e.loaded;
            },
            completeAll: function() {
                setTimeout(function() {
                    vcimport_bar.setAttribute('hidden', 'hidden');
                }, 1000);
                let response = {};
                try {
                    response = JSON.parse(arguments[0].response);
                } catch (e) {
                    // Ignore
                }
                if (response.uid) {
                    $('#zoiaVariantsCollectionsImportDialogBody').hide();
                    $('#zoiaVariantsCollectionsImportDialogSpinner').show();
                    $('#zoiaVariantsCollectionsImportDialogFooter').hide();
                    setTimeout(() => {
                        variantsCollectionsImportTaskStateCheck(response.uid);
                    }, 5000);
                } else {
                    $zUI.notification(lang['Could not upload file'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }
        });
    };

    const initAddressSelect = () => {
        for (let i in addressData) {
            const item = addressData[i];
            $('#zoiaAddressSelect').append('<option value="' + item.id + '">' + item.title[locale] + '</option>');
        }
    };

    const initOrderDialogFields = () => {
        // Statuses
        for (let i in lang.orderStatuses) {
            $('#za_catalog_order_status').append('<option value="' + i + '">' + lang.orderStatuses[i] + '</option>');
        }
        // Address fields
        let formHTML = '';
        for (let i in addressJSON) {
            let item = addressJSON[i];
            switch (item.type) {
                case 'select':
                    let opts = '<option value=""></option>';
                    for (let v in item.values) {
                        const iv = item.values[v];
                        opts += '<option value="' + iv.value + '" data-addprc="' + iv.addPrc + '" data-cost="' + iv.cost + '">' + iv.lang[locale] + '</option>';
                    }
                    formHTML += '<div class="za-margin"><label class="za-form-label" for="za_catalog_order_form_' + item.id + '">' + item.label[locale] + ':&nbsp;</label><div class="za-form-controls"><select class="za-catalog-form-input za-catalog-order-form-rx za-select za-width-' + item.width + '" id="za_catalog_order_form_' + item.id + '">' + opts + '</select></div></div>';
                    break;
                default:
                    formHTML += '<div class="za-margin"><label class="za-form-label" for="za_catalog_order_form_' + item.id + '">' + item.label[locale] + ': ' + '</label><div class="za-form-controls"><input class="za-catalog-order-form-rx za-catalog-form-input za-input za-width-' + item.width + '" id="za_catalog_order_form_' + item.id + '" type="text" maxlength="' + item.maxlength + '" data-mask="' + (item.regex ? item.regex : '') + '" data-mandatory="' + (item.mandatory ? 'true' : '') + '"></div></div>';
                    break;
            }
        }
        $('#za_catalog_order_address_form').html(formHTML);
    };

    const zoiaAddPropertyBtnClick = () => {
        $('#propertiesselect').zoiaTable().load();
        propertiesSelectDialog.show();
    };

    const zoiaAddVariantBtnClick = () => {
        $('#variantsselect').zoiaTable().load();
        variantsSelectDialog.show();
    };

    const zoiaPropertiesSelectDialogCloseBtnClick = () => {
        propertiesSelectDialog.hide().then(() => {
            $(window).scrollTop($('#editForm_properties_widget').offset().top - 100);
        });
    };

    const zoiaVariantsSelectDialogCloseBtnClick = () => {
        variantsSelectDialog.hide().then(() => {
            $(window).scrollTop($('#editForm_variants_widget').offset().top - 100);
        });
    };

    const zoiaAddCollectionBtnClick = () => {
        $('#collectionselect').zoiaTable().load();
        collectionSelectDialog.show();
    };

    const zoiaAddVariantCollectionBtnClick = () => {
        $('#variantcollectionselect').zoiaTable().load();
        variantCollectionSelectDialog.show();
    };

    const zoiaPropertiesImportButtonClick = () => {
        $('#zoiaPropertiesImportDialogBody').show();
        $('#zoiaPropertiesImportDialogSpinner').hide();
        $('#zoiaPropertiesImportDialogFooter').show();
        propertiesImportDialog.show();
    };

    const zoiaVariantsImportButtonClick = () => {
        $('#zoiaVariantsImportDialogBody').show();
        $('#zoiaVariantsImportDialogSpinner').hide();
        $('#zoiaVariantsImportDialogFooter').show();
        variantsImportDialog.show();
    };

    const zoiaVariantsCollectionsImportButtonClick = () => {
        $('#zoiaVariantsCollectionsImportDialogBody').show();
        $('#zoiaVariantsCollectionsImportDialogSpinner').hide();
        $('#zoiaVariantsCollectionsImportDialogFooter').show();
        variantsCollectionsImportDialog.show();
    };

    const zoiaCollectionsImportButtonClick = () => {
        $('#zoiaCollectionsImportDialogBody').show();
        $('#zoiaCollectionsImportDialogSpinner').hide();
        $('#zoiaCollectionsImportDialogFooter').show();
        collectionsImportDialog.show();
    };

    const warehouseBtnDeliveryDialogClick = () => {
        $('#delivery').zoiaTable().load();
        deliveryDialog.show();
    };

    const warehouseBtnAddressDialogClick = () => {
        addressEditDialog.show();
        $('.zoiaAddressEditDialogSpinner').show();
        $('.zoiaAddressEditDialogWrap').hide();
        $('#editAddressForm').zoiaFormBuilder().loadData();
    };

    const editAddressForm_properties_btnClick = () => {
        $('#zoiaAddressSelect').prop('selectedIndex', 0);
        addressAddEditDialog.show();
    };

    const btnAddressAddClick = () => {
        addressAddEditDialog.hide();
        $('.addressFormDataItems').append('<div class="za-card za-card-default za-card-small za-card-body" data-pid="' + $('#zoiaAddressSelect').val() + '"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span>' + $('#zoiaAddressSelect option:selected').text() + '&nbsp;&ndash;&nbsp;' + $('#zoiaAddressSelect').val() + '&nbsp;<label><input type="checkbox" class="za-checkbox" id="za_address_cbx_' + $('#zoiaAddressSelect').val() + '">&nbsp;*</label><button type="button" class="addressItemClose" za-close style="float:right"></button></div>');
        $('.addressItemClose').unbind();
        $('.addressItemClose').click(function() {
            $(this).parent().remove();
        });
    };

    const za_catalog_order_btn_addClick = () => {
        if ($('#za_catalog_order_btn_add_spinner').is(':visible')) {
            return;
        }
        const val = $('#za_catalog_order_sku').val().trim();
        if (!val || !val.match(/^[A-Za-z0-9_\-]+$/)) {
            $('#za_catalog_order_sku').addClass('za-form-danger');
            return;
        }
        $('#za_catalog_order_btn_add_spinner').show();
        $('#za_catalog_order_sku').removeClass('za-form-danger');
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/orders/load/item',
            data: {
                sku: val
            },
            cache: false
        }).done((res) => {
            $('#za_catalog_order_btn_add_spinner').hide();
            if (res && res.status === 1 && res.data) {
                ordersItemCacheData = {
                    properties: res.data.properties,
                    title: res.data.title,
                    variants: res.data.variants
                };
                $('#zoiaOrderAddOptionsDialogVariants').html('');
                $('#zoiaOrderAddOptionsDialogCheckboxes').html('');
                $('#zoiaOrderAddOptionsDialogIntegers').html('');
                $('#zoiaOrderAddOptionsDialogSelects').html('');
                let variantsHTML = '<div class="za-form-controls za-margin-top">';
                variantsHTML += '<label><input class="za-radio za-catalog-item-variant" type="radio" name="za_item_variants" data-id="" checked="checked">&nbsp;' + lang['Default'] + '</label><br>';
                for (let variant in res.data.variants) {
                    variantsHTML += '<div><label><input class="za-radio za-catalog-item-variant" type="radio" name="za_item_variants" data-id="' + variant + '">&nbsp;' + res.data.variants[variant] + '</label></div>';
                }
                variantsHTML += '</div>';
                $('#zoiaOrderAddOptionsDialogVariants').html(variantsHTML);
                let checkboxesHTML = '<div class="za-form-controls">';
                for (let i in res.data.checkboxes) {
                    checkboxesHTML += '<div><label><input class="za-checkbox za-catalog-item-checkbox" type="checkbox" data-id="' + res.data.checkboxes[i] + '">&nbsp;' + res.data.properties[res.data.checkboxes[i]] + '</label></div>';
                }
                checkboxesHTML += '</div>';
                $('#zoiaOrderAddOptionsDialogCheckboxes').html(checkboxesHTML);
                let integersHTML = '<div class="za-form-controls">';
                for (let i in res.data.integers) {
                    integersHTML += '<div><label><input class="za-checkbox za-catalog-item-integer" type="checkbox" data-id="' + res.data.integers[i] + '">&nbsp;' + res.data.properties[res.data.integers[i]] + '&nbsp;<input class="za-input za-form-width-xsmall za-form-small" value="1" type="number" min="1" step="1" id="za_catalog_item_integer_' + res.data.integers[i] + '" style="width:80px"></label></div>';
                }
                integersHTML += '</div>';
                $('#zoiaOrderAddOptionsDialogSelects').html(integersHTML);
                let selectsHTML = '<div class="za-form-controls">';
                for (let i in res.data.selects) {
                    const [title, valuesStr] = res.data.properties[res.data.selects[i]].split('|');
                    const values = valuesStr.split(',');
                    selectsHTML += '<div class="za-margin"><label class="za-form-label" for="form-horizontal-text">' + title + '</label><div class="za-form-controls"><select data-id="' + res.data.selects[i] + '" class="za-select za-form-width-medium za-catalog-item-select" id="' + res.data.selects[i] + '" type="select">';
                    for (let v in values) {
                        selectsHTML += '<option value="' + v + '">' + values[v] + '</option>';
                    }
                    selectsHTML += '</select></div></div>';
                }
                selectsHTML += '</div>';
                $('#zoiaOrderAddOptionsDialogSelects').html(selectsHTML);
                orderAddOptionsDialog.show();
            } else {
                $zUI.notification(lang['Could not create new item'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#za_catalog_order_btn_add_spinner').hide();
            $zUI.notification(lang['Could not create new item'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const zoiaOrderAddOptionsAddClick = () => {
        let checkboxes = [];
        let integers = [];
        let selects = [];
        $('.za-catalog-item-checkbox').each(function() {
            if ($(this).is(':checked')) {
                checkboxes.push($(this).attr('data-id'));
            }
        });
        $('.za-catalog-item-integer').each(function() {
            if ($(this).is(':checked')) {
                const id = $(this).attr('data-id');
                let val = parseInt($('#za_catalog_item_integer_' + id).val(), 10);
                if (!val) {
                    val = 1;
                }
                integers.push($(this).attr('data-id') + '|' + val);
            }
        });
        $('.za-catalog-item-select').each(function() {
            let val = $(this).val();
            selects.push($(this).attr('data-id') + '|' + val);
        });
        let extraHTML = '';
        for (let c in checkboxes) {
            if (ordersItemCacheData.properties[checkboxes[c]]) {
                extraHTML += '<br>' + ordersItemCacheData.properties[checkboxes[c]];
            }
        }
        for (let c in integers) {
            const [iid, cnt] = integers[c].split('|');
            if (ordersItemCacheData.properties[iid]) {
                extraHTML += '<br>' + ordersItemCacheData.properties[iid] + '&nbsp;(' + cnt + ')';
            }
        }
        for (let c in selects) {
            const [sid, cnt] = selects[c].split('|');
            if (ordersItemCacheData.properties[sid]) {
                const [title, valuesStr] = ordersItemCacheData.properties[sid].split('|');
                const values = valuesStr.split(',');
                extraHTML += '<br>' + title + ':&nbsp;' + values[cnt];
            }
        }
        const variant = $('input[name="za_item_variants"]:checked').attr('data-id');
        const sku = $('#za_catalog_order_sku').val().trim();
        $('#za_catalog_order_cart_table>tbody').append('<tr><td class="za-table-shrink" data-variant="' + sku + '|' + variant + '" data-checkboxes="' + checkboxes + '" data-integers="' + integers + '" data-selects="' + selects + '">' + sku + '</td><td class="za-table-expand">' + ordersItemCacheData.title + (variant ? '&nbsp;(' + ordersItemCacheData.variants[variant] + ')' : '') + extraHTML + '</td><td class="za-table-shrink"><input class="za-input za-form-width-xsmall" value="1"></td><td class="za-table-shrink"><div style="height:20px"><span za-icon="icon:trash;ratio:0.8" class="za-catalog-cart-del"></span></div></td></tr>');
        $('.za-catalog-cart-del').unbind().click(function() {
            $(this).parent().parent().parent().remove();
        });
        orderAddOptionsDialog.hide();
    };

    const za_catalog_order_btn_addCostClick = () => {
        const val = $('#za_catalog_order_costid').val().trim();
        if (!val || !val.match(/^[A-Za-z0-9_\-]+$/) || !currentAddressData[val]) {
            $('#za_catalog_order_costid').addClass('za-form-danger');
            return;
        }
        $('#za_catalog_order_costid').removeClass('za-form-danger');
        $('#za_catalog_order_costs_table').append('<tr><td class="za-table-expand" data="' + val + '">' + currentAddressData[val] + '</td><td class="za-table-shrink"><input class="za-input za-form-width-xsmall" value="0" style="width:100px"></td><td class="za-table-shrink"><div style="height:20px"><span za-icon="icon:trash;ratio:0.8" class="za-catalog-cost-del"></span></div></td></tr>');
        $('.za-catalog-cost-del').unbind().click(function() {
            $(this).parent().parent().parent().remove();
        });
    };

    const zoiaOrderDialogButtonClick = () => {
        let data = {
            costs: {
                extra: {}
            },
            address: {},
            cart: {}
        };
        data.date = parseInt($('#za_catalog_order_date').attr('data'), 10);
        data.username = $('#za_catalog_order_username').val().trim();
        data.email = $('#za_catalog_order_email').val().trim();
        data.phone = $('#za_catalog_order_phone').val().trim();
        data.status = $('#za_catalog_order_status').val();
        data.delivery = $('#za_catalog_order_delivery').val();
        data.tracking = $('#za_catalog_order_tracking').val().trim();
        data.paid = $('#za_catalog_order_paid').is(':checked');
        data.costs.delivery = $('#za_catalog_order_cost_delivery').val().trim();
        data.costs.total = $('#za_catalog_order_cost_total').val().trim();
        data.costs.totalWares = $('#za_catalog_order_cost_wares').val().trim();
        $('#za_catalog_order_cart_table>tbody>tr').each(function() {
            data.cart[$(this).children().eq(0).attr('data-variant')] = {};
            data.cart[$(this).children().eq(0).attr('data-variant')].count = parseInt($(this).children().eq(2).find('input').val(), 10) || 0;
            data.cart[$(this).children().eq(0).attr('data-variant')].checkboxes = $(this).children().eq(0).attr('data-checkboxes') ? $(this).children().eq(0).attr('data-checkboxes').split(',') : [];
            data.cart[$(this).children().eq(0).attr('data-variant')].integers = $(this).children().eq(0).attr('data-integers') ? $(this).children().eq(0).attr('data-integers').split(',') : [];
            data.cart[$(this).children().eq(0).attr('data-variant')].selects = $(this).children().eq(0).attr('data-selects') ? $(this).children().eq(0).attr('data-selects').split(',') : [];
        });
        $('#za_catalog_order_costs_table>tbody>tr').each(function() {
            data.costs.extra[$(this).children().eq(0).attr('data')] = parseFloat($(this).children().eq(1).find('input').val()) || 0;
            data.costs.extra[$(this).children().eq(0).attr('data')] = parseFloat(data.costs.extra[$(this).children().eq(0).attr('data')]).toFixed(2);
        });
        for (let i in addressJSON) {
            data.address[addressJSON[i].id] = $('#za_catalog_order_form_' + addressJSON[i].id).val().trim();
        }
        $('#zoiaOrderDialogBody').hide();
        $('#zoiaOrderDialogButtons').hide();
        $('#zoiaOrderDialogBodySpinner').show();
        $.ajax({
            type: 'POST',
            url: '/api/warehouse/orders/save',
            data: {
                id: currentEditID,
                data: data
            },
            cache: false
        }).done((res) => {
            $('#zoiaOrderDialogBody').show();
            $('#zoiaOrderDialogButtons').show();
            $('#zoiaOrderDialogBodySpinner').hide();
            if (res && res.status === 1) {
                orderDialog.hide();
                $('#orders').zoiaTable().load();
                $zUI.notification(lang.fieldErrors['Saved successfully'], {
                    status: 'success',
                    timeout: 1500
                });
            } else {
                $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }
        }).fail(() => {
            $('#zoiaOrderDialogBody').show();
            $('#zoiaOrderDialogButtons').show();
            $('#zoiaOrderDialogBodySpinner').hide();
            $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                status: 'danger',
                timeout: 1500
            });
        }, 200);
    };

    const zoiaOrderDialogReturnClick = () => {
        $zUI.modal.confirm(lang['Order will be cancelled and all items will be returned to the warehouse. Continue?'], { labels: { ok: lang['Yes'], cancel: lang['Cancel'] }, stack: true }).then(() => {
            orderDialog.hide();
            $('#zoiaSpinnerMain').show();
            $.ajax({
                type: 'POST',
                url: '/api/warehouse/orders/return',
                data: {
                    id: currentEditID
                },
                cache: false
            }).done((res) => {
                $('#zoiaSpinnerMain').hide();
                if (res && res.status === 1) {                    
                    $zUI.notification(lang.fieldErrors['Saved successfully'], {
                        status: 'success',
                        timeout: 1500
                    });
                    $('#orders').zoiaTable().load();
                } else {
                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                        status: 'danger',
                        timeout: 1500
                    });
                }
            }).fail(() => {
                $('#zoiaSpinnerMain').hide();
                $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                    status: 'danger',
                    timeout: 1500
                });
            }, 200);
        }, () => {});
    };

    const warehouseBtnRefreshClick = () => {
        $('#warehouse').zoiaTable().load();
    };

    const ordersBtnRefreshClick = () => {
        $('#orders').zoiaTable().load();
    };

    const zoiaPropertiesCopyNumericClick = () => {
        for (let i in editShadow) {
            if (i !== editLanguage) {
                for (let j in editShadow[i].data.properties.value) {
                    const item = editShadow[i].data.properties.value[j];
                    const nval = parseFloat(item.v);
                    if (nval) {
                        $('.formBuilder-valueslist-val[data="' + item.d + '"]').val(nval);
                    }
                }
                return;
            }
        }
    };

    const zoiaPropertiesSyncNumericClick = () => {
        for (let i in editShadow) {
            if (i !== editLanguage) {
                for (let j in editShadow[i].data.properties.value) {
                    const item = editShadow[i].data.properties.value[j];
                    const val = $('.formBuilder-valueslist-val[data="' + item.d + '"]').val();
                    const nval = parseFloat(val);
                    if (nval) {
                        editShadow[i].data.properties.value[j].v = val;
                    }
                }
                return;
            }
        }
    };

    $(document).ready(() => {
        locale = $('#zp_locale').attr('data');
        corePrefix = JSON.parse($('#zp_corePrefix').attr('data'));
        uprefix = $('#zp_uprefix').attr('data');
        langs = JSON.parse($('#zp_langs').attr('data'));
        foldersData = JSON.parse($('#zp_foldersData').attr('data'));
        testMode = $('#zp_testMode').attr('data') === 'true' ? true : false;
        addressData = JSON.parse($('#zp_addressData').attr('data'));
        addressJSON = JSON.parse($('#zp_addressJSON').attr('data'));
        settings = JSON.parse($('#zp_settings').attr('data'));
        settingsData = JSON.parse($('#zp_settingsData').attr('data'));
        $.getScript(`/api/lang/warehouse/${locale}.js`).done(() => {
            const formBuilderHTML = {
                helpText: '<div class="za-text-meta">{text}</div>',
                text: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><input class="za-input {prefix}-form-field{css}" id="{prefix}_{name}" type="{type}" placeholder=""{autofocus}><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                select: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><select{multiple} class="za-select {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}>{values}</select><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                passwordConfirm: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-flex"><div class="{prefix}-field-wrap"><input class="za-input {prefix}-form-field" id="{prefix}_{name}" type="password" placeholder=""{autofocus}></div><div><input class="za-input {prefix}-form-field" id="{prefix}_{name}Confirm" type="password" placeholder=""></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div>',
                captcha: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-grid za-grid-small"><div><input class="za-input {prefix}-form-field {prefix}-captcha-field{css}" type="text" placeholder="" id="{prefix}_{name}"{autofocus}></div><div><div class="za-form-controls"><img class="{prefix}-captcha-img"></div></div></div><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}',
                buttonsWrap: '<div class="{css}">{buttons}{html}</div>',
                button: '<button class="za-button {prefix}-form-button{css}" id="{prefix}_{name}" type="{type}">{label}</button>',
                launcher: '<div class="za-margin"><label class="za-form-label" for="{prefix}_{name}_btn">{label}:</label><div class="za-flex"><div id="{prefix}_{name}_val" class="{prefix}-{name}-selector" data="{data}">{value}</div><div><button class="za-button za-button-default" id="{prefix}_{name}_btn" type="button">{labelBtn}</button></div></div>{helpText}{html}</div>',
                textarea: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><br><div class="za-form-controls"><textarea class="za-textarea {prefix}-form-field{css}" id="{prefix}_{name}"{autofocus}></textarea><div id="{prefix}_{name}_error_text" class="{prefix}-error-text" style="display:none"><span class="za-label-danger"></span></div>{helpText}</div></div>',
                checkboxlistItem: '<li><label><input class="za-checkbox {prefix}-{name}-cbx" type="checkbox" data="{title}">&nbsp;&nbsp;{title}</label></li>',
                checkboxlist: '<div class="za-margin-bottom"><label class="za-form-label" for="{prefix}_{name}">{label}:</label><div class="za-panel za-panel-scrollable{css}" id="{prefix}_{name}_wrap"><ul class="za-list">{items}</ul></div>{helpText}</div>',
                valueslistItem: '<div class="za-flex za-margin-top {prefix}-{name}-item"><div class="za-margin-right"><input placeholder="{langParameter}" type="text" class="za-input formBuilder-valueslist-par" value="{key}"></div><div class="za-margin-right"><input placeholder="{langValue}" type="text" class="za-input formBuilder-valueslist-val" value="{value}"></div><div style="padding-top:3px"><button class="za-icon-button za-button-danger formBuilder-valueslist-btnDel" za-icon="icon:minus"></button></div></div>',
                valueslistItemFixed: '<div class="za-flex za-margin-top {prefix}-{name}-item"><div class="za-margin-right" style="margin-top:10px;min-width:100px;font-size:80%">{value}:</div><div class="za-margin-right"><input placeholder="{langValue}" type="text" class="za-input formBuilder-valueslist-val {prefix}-{name}-item-val" value="{data}" data="{key}"></div></div>',
                valueslistItemEditable: '<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body {prefix}-{name}-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">{key}</label><input placeholder="{langValue}" type="text" class="za-input za-width-1-1 formBuilder-valueslist-val" value="{value}" data="{data}"></div></div>',
                valueslistItemEditablePostfix: '<div class="za-flex za-width-1-2@l za-width-1-1@m za-card za-card-default za-card-small za-card-body {prefix}-{name}-item"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span><div class="za-width-1-1"><button type="button" class="selectPropertyItemClose" za-close style="float:right"></button><label class="za-form-label formBuilder-valueslist-par">{key}</label><div><div class="za-inline za-form-width-medium"><span class="za-form-icon za-form-icon-flip">{postfix}</span><input placeholder="{langValue}" type="number" step="0.01" class="za-input za-width-1-1 formBuilder-valueslist-val" value="{value}" data-postfix="{postfix}" data="{data}"></div></div></div></div>',
                valueslist: '<div class="za-flex za-flex-column"><div class="za-margin-bottom"><label class="za-form-label">{label}:</label></div><div><button type="button" class="za-icon-button za-button-primary formBuilder-valueslist-btnAdd" id="{prefix}_{name}_btnAdd" za-icon="icon:plus" data-prefix="{prefix}" data-name="{name}"></button></div><div id="{prefix}_{name}_wrap" class="za-margin-bottom {prefix}-formBuilder-valueslist-wrap">{items}</div>',
                valueslistFixed: '<div class="za-flex za-flex-column"><div><label class="za-form-label">{label}:</label></div><div id="{prefix}_{name}_wrap" class="za-margin-bottom formBuilder-valueslist-wrap">{items}</div></div>',
                valueslistEditable: '<div class="za-flex za-flex-column" id="{prefix}_{name}_widget"><div class="za-margin-bottom"><label class="za-form-label">{label}:</label></div>{buttons}<div id="{prefix}_{name}_wrap" class="za-margin-bottom {prefix}-formBuilder-valueslist-wrap" za-sortable="handle:.za-sortable-handle">{items}</div><div class="za-margin-bottom">{helpText}</div></div>',
                bullet: '&nbsp;<span style="color:red;font-size:140%">&#8226;</span>'
            };
            const formBuilderLang = {
                mandatoryMissing: lang['Should not be empty'],
                tooShort: lang['Too short'],
                tooLong: lang['Too long'],
                invalidFormat: lang['Doesn\'t match required format'],
                passwordsNotMatch: lang['Passwords do not match'],
                parameter: lang['Parameter'],
                value: lang['Value']
            };
            const editFormData = {
                formDangerClass: 'za-form-danger',
                template: {
                    fields: '{fields}',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/save',
                    method: 'POST'
                },
                load: {
                    url: '/api/warehouse/load',
                    method: 'GET'
                },
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data) => {
                        editShadow[editLanguage].data = $('#editForm').zoiaFormBuilder().serialize();
                        syncEditFormProperties(editLanguage);
                        let saveFolder = editShadow[editLanguage].data.folder.id;
                        let saveImages = editShadow[editLanguage].data.images.id;
                        let saveURL = editShadow[editLanguage].data.folder.value;
                        let saveSKU = editShadow[editLanguage].data.sku.value;
                        let saveWeight = editShadow[editLanguage].data.weight.value;
                        let saveAmount = editShadow[editLanguage].data.amount.value;
                        let savePrice = editShadow[editLanguage].data.price.value;
                        let saveStatus = editShadow[editLanguage].data.status.value;
                        let savePinned = editShadow[editLanguage].data.pinned.value;
                        let saveVariants = editShadow[editLanguage].data.variants.value;
                        for (let n in editShadow) {
                            if (!editShadow[n].enabled) {
                                continue;
                            }
                            let lngdata = editShadow[n].data;
                            let vr = $('#editForm').zoiaFormBuilder().validate(lngdata);
                            if (Object.keys(vr.errors).length > 0) {
                                onZoiaEditLanguagesClick(n);
                                markZoiaLanguagesTab(n);
                                syncEditFormProperties(editLanguage);
                                vr = $('#editForm').zoiaFormBuilder().validate($('#editForm').zoiaFormBuilder().serialize());
                                if ($('#editForm').zoiaFormBuilder().errors(vr.errors)) {
                                    editShadow[editLanguage].data.properties.type = 'valueslisteditable';
                                    editShadow[editLanguage].data.variants.type = 'valueslisteditable';
                                    $('#editForm').zoiaFormBuilder().deserializePart('properties', editShadow[editLanguage].data.properties);
                                    $('#editForm').zoiaFormBuilder().deserializePart('variants', editShadow[editLanguage].data.variants);
                                    return '__stop';
                                }
                            }
                            vr.data.folder = saveFolder;
                            vr.data.url = (saveURL + '/' + saveSKU).replace(/^\//, '').replace(/\/$/, '');
                            vr.data.sku = saveSKU;
                            vr.data.weight = saveWeight;
                            vr.data.amount = saveAmount;
                            vr.data.price = savePrice;
                            vr.data.status = saveStatus;
                            vr.data.pinned = savePinned;
                            vr.data.images = saveImages;
                            vr.data.variants = saveVariants;
                            data[n] = vr.data;
                        }
                        data.id = currentEditID;
                        editSpinner(true);
                        return data;
                    },
                    onSaveSuccess: () => {
                        editSpinner(false);
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                        $('#warehouse').zoiaTable().load();
                        $('#zoiaEdit').hide();
                        $('#wrapTable').show();
                        window.history.pushState({ action: '' }, document.title, uprefix + corePrefix.admin + '/warehouse');
                    },
                    onSaveError: (res) => {
                        editSpinner(false);
                        if (res && res.status !== undefined) {
                            switch (res.status) {
                                case -1:
                                    $zUI.notification(lang.fieldErrors['Page not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                case -2:
                                    $zUI.notification(lang.fieldErrors['Page already exists in database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                default:
                                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                            }
                        }
                    },
                    onLoadSuccess: (data) => {
                        for (let n in langs) {
                            if (!data.item[n]) {
                                data.item[n] = {};
                            }
                            if (Object.keys(data.item[n]).length === 0) {
                                editShadow[n] = {
                                    enabled: false
                                };
                                continue;
                            }
                            editShadow[n] = {
                                enabled: true,
                                data: {}
                            };
                            let path = treePath(foldersData, data.item.folder);
                            if (path) {
                                path = path.reverse().join('/').replace('//', '');
                                if (path === '/') {
                                    path = '';
                                }
                                editShadow[n].data.folder = {
                                    type: 'launcher',
                                    id: data.item.folder,
                                    value: path
                                };
                            } else {
                                editShadow[n].data.folder = {
                                    type: 'launcher',
                                    id: 1,
                                    value: '<div za-icon="icon:ban" style="padding-top:4px"></div>'
                                };
                            }
                            if (data.item.images && data.item.images.length) {
                                editShadow[n].data.images = {
                                    type: 'launcher',
                                    id: JSON.stringify(data.item.images),
                                    value: data.item.images.length
                                };
                            } else {
                                editShadow[n].data.images = {
                                    type: 'launcher',
                                    id: JSON.stringify([]),
                                    value: '0'
                                };
                            }
                            $('#imagesList').html('');
                            for (let i in data.item.images) {
                                const img = data.item.images[i];
                                $('#imagesList').append('<div class="za-card za-card-default za-card-body warehouse-image-item" data-id="' + img.id + '" data-ext="' + img.ext + '"><img src="/warehouse/static/images/' + currentEditID + '/tn_' + img.id + '.' + img.ext + '"></div>');
                            }
                            $('#imagesListBtnDel').hide();
                            initShifty();
                            editShadow[n].data.sku = {
                                type: 'text',
                                value: data.item.sku
                            };
                            editShadow[n].data.weight = {
                                type: 'text',
                                value: data.item.weight
                            };
                            editShadow[n].data.amount = {
                                type: 'text',
                                value: data.item.amount
                            };
                            editShadow[n].data.price = {
                                type: 'text',
                                value: data.item.price ? String(data.item.price) : '0'
                            };
                            editShadow[n].data.title = {
                                type: 'text',
                                value: data.item[n].title
                            };
                            editShadow[n].data.properties = {
                                type: 'valueslisteditable',
                                value: data.item[n].properties
                            };
                            editShadow[n].data.variants = {
                                type: 'valueslisteditable',
                                value: data.item.variants
                            };
                            editShadow[n].data.status = {
                                type: 'select',
                                value: data.item.status
                            };
                            editShadow[n].data.pinned = {
                                type: 'select',
                                value: data.item.pinned
                            };
                            editShadow[n].data.keywords = {
                                type: 'text',
                                value: data.item[n].keywords
                            };
                            editShadow[n].data.description = {
                                type: 'text',
                                value: data.item[n].description
                            };
                            editShadow[n].data.content = {
                                type: 'textarea',
                                value: data.item[n].content
                            };
                        }
                        $('#zoiaEditLanguageCheckbox').prop('checked', editShadow[editLanguage].enabled);
                        $('.selectPropertyItemClose').unbind();
                        for (let n in langs) {
                            if (editShadow[n].enabled) {
                                $('#zoiaEditLanguages > li[data=' + n + ']').click();
                                $('#zoiaEdit').show();
                                break;
                            }
                        }
                        $('.selectPropertyItemClose').unbind();
                        $('.selectPropertyItemClose').click(function() {
                            $(this).parent().parent().remove();
                        });
                        $('#zoiaSpinnerMain').hide();
                    },
                    onLoadError: () => {
                        $('#zoiaSpinnerMain').hide();
                        $('#zoiaEdit').hide();
                        $('#wrapTable').show();
                        $zUI.notification(lang['Could not load information from database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                },
                validation: false,
                items: {
                    folder: {
                        type: 'launcher',
                        label: lang['Folder'],
                        labelBtn: lang['Select'],
                        value: '',
                        data: 1
                    },
                    sku: {
                        type: 'text',
                        label: lang['SKU'],
                        css: 'za-width-medium',
                        autofocus: true,
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: /^[A-Za-z0-9_\-]+$/,
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Latin characters and numbers only (1-64 chars)']
                    },
                    title: {
                        type: 'text',
                        label: lang['Title'],
                        css: 'za-width-large@m',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Required, max. 128 characters']
                    },
                    price: {
                        type: 'text',
                        label: lang['Price'],
                        css: 'za-width-small',
                        autofocus: false,
                        validation: {
                            mandatoryEdit: false,
                            mandatoryCreate: false,
                            length: {
                                min: 1,
                                max: 32
                            },
                            type: 'string',
                            regexp: /^[0-9]+\.?([0-9]+)?$/,
                            process: function(item) {
                                return item.trim();
                            }
                        },
                        helpText: lang['Example: 123.45']
                    },
                    variants: {
                        type: 'valueslisteditable',
                        buttons: '<div class="za-margin-bottom"><ul class="za-iconnav"><li><button type="button" class="za-icon-button zoiaAddVariantBtn" za-icon="icon:file" title="' + lang['Insert variant'] + '" za-tooltip="pos: bottom-right"></button></li><li><button type="button" class="za-icon-button zoiaAddVariantCollectionBtn"za-icon="icon:album" title="' + lang['Insert variants collection'] + '" za-tooltip="pos: bottom-right"></button></li><li><button type="button" class="za-icon-button zoiaRemoveAllVariants"za-icon="icon:trash" title="' + lang['Remove all variants'] + '" za-tooltip="pos: bottom-right"></button></li></ul></div>',
                        helpText: lang['Use drag-and-drop to arrange variants order'],
                        label: lang['Price Variants']
                    },
                    weight: {
                        type: 'text',
                        label: lang['Weight'],
                        css: 'za-width-small',
                        autofocus: false,
                        validation: {
                            mandatoryEdit: false,
                            mandatoryCreate: false,
                            length: {
                                min: 1,
                                max: 32
                            },
                            type: 'string',
                            regexp: /^[0-9]+\.?([0-9]+)?$/,
                            process: function(item) {
                                return item.trim();
                            }
                        },
                        helpText: lang['Example: 123.45']
                    },
                    amount: {
                        type: 'text',
                        label: lang['Amount'],
                        css: 'za-width-small',
                        autofocus: false,
                        validation: {
                            mandatoryEdit: false,
                            mandatoryCreate: false,
                            length: {
                                min: 1,
                                max: 32
                            },
                            type: 'string',
                            regexp: /^[0-9]+$/,
                            process: function(item) {
                                return item.trim();
                            }
                        },
                        helpText: lang['Example: 123']
                    },
                    status: {
                        type: 'select',
                        label: lang['Status'],
                        css: 'za-form-width-small',
                        values: {
                            0: lang.statuses[0],
                            1: lang.statuses[1]
                        },
                        default: '1',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 1
                            },
                            regexp: /^(0|1)$/
                        }
                    },
                    pinned: {
                        type: 'select',
                        label: lang['Pinned'],
                        css: 'za-form-width-small',
                        values: {
                            0: lang.pinned[0],
                            1: lang.pinned[1]
                        },
                        default: '0',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 1
                            },
                            regexp: /^(0|1)$/
                        }
                    },
                    images: {
                        type: 'launcher',
                        label: lang['Images'],
                        labelBtn: lang['Browse'],
                        value: '',
                        data: null
                    },
                    properties: {
                        type: 'valueslisteditable',
                        buttons: '<div class="za-margin-bottom"><ul class="za-iconnav"><li><button type="button" class="za-icon-button zoiaAddPropertyBtn" za-icon="icon:file" title="' + lang['Insert property'] + '" za-tooltip="pos: bottom-right"></button></li><li><button type="button" class="za-icon-button zoiaAddCollectionBtn"za-icon="icon:album" title="' + lang['Insert collection'] + '" za-tooltip="pos: bottom-right"></button></li><li><button type="button" class="za-icon-button zoiaRemoveAllProperties"za-icon="icon:trash" title="' + lang['Remove all properties'] + '" za-tooltip="pos: bottom-right"></button></li><li><button type="button" class="za-icon-button zoiaPropertiesCopyNumeric"za-icon="icon:copy" title="' + lang['Copy numeric values'] + '" za-tooltip="pos: bottom-right"></button></li><li><button type="button" class="za-icon-button zoiaPropertiesSyncNumeric"za-icon="icon:move" title="' + lang['Synchronize numeric values'] + '" za-tooltip="pos: bottom-right"></button></li></ul></div>',
                        helpText: lang['Use drag-and-drop to arrange properties order'],
                        label: lang['Properties']
                    },
                    keywords: {
                        type: 'text',
                        label: lang['Keywords'],
                        css: 'za-width-large@m',
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Optional, max. 128 characters']
                    },
                    description: {
                        type: 'text',
                        label: lang['Description'],
                        css: 'za-width-large@m',
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 128
                            },
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Optional, max. 128 characters']
                    },
                    content: {
                        type: 'textarea',
                        label: lang['Content'],
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false
                        },
                        css: 'zoiaFormBuilder-no-reset'
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-edit-buttons-wrap',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default',
                            name: 'btnCancel'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none" id="zoiaEditSpinner"></div>'
                    }
                },
                lang: formBuilderLang
            };
            const editFolderFormData = {
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: () => {
                        let sel = foldersTree.jstree(true).get_selected();
                        if (foldersEditMode) {
                            foldersTree.jstree(true).rename_node(sel, $('#editFolderForm_id').val());
                            foldersTree.jstree(true).get_node(sel).data = {};
                            foldersTree.jstree(true).get_node(sel).data.lang = {};
                            for (let lng in langs) {
                                foldersTree.jstree(true).get_node(sel).data.lang[lng] = $('#editFolderForm_' + lng).val();
                            }
                            foldersTree.jstree(true).open_node(sel);
                            folderEditDialog.hide();
                            foldersModified = true;
                        } else {
                            let cn = foldersTree.jstree(true).create_node(sel, {
                                id: Date.now() / 1000 | 0,
                                text: $('#editFolderForm_id').val(),
                                type: 'folder'
                            });
                            if (!cn) {
                                $zUI.notification(lang['Duplicate folder'], {
                                    status: 'danger',
                                    timeout: 1500
                                });
                                $('#editFolderForm_id').focus();
                                return '__stop';
                            }
                            foldersTree.jstree(true).get_node(cn).data = {};
                            foldersTree.jstree(true).get_node(cn).data.lang = {};
                            for (let lng in langs) {
                                foldersTree.jstree(true).get_node(cn).data.lang[lng] = $('#editFolderForm_' + lng).val();
                            }
                            foldersTree.jstree(true).open_node(sel);
                            folderEditDialog.hide();
                            foldersModified = true;
                        }
                        return '__stop';
                    }
                },
                items: getEditFolderFormItems(),
                lang: formBuilderLang
            };
            const editSettingsFormData = {
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/settings',
                    method: 'POST'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data, errors) => {
                        if ($('#editSettingsForm').zoiaFormBuilder().errors(errors)) {
                            return '__stop';
                        }
                        $('.editSettingsForm-form-button').hide();
                        $('#zoiaSettingsSpinner').show();
                        return data;
                    },
                    onSaveSuccess: (res) => {
                        $('.editSettingsForm-form-button').show();
                        $('#zoiaSettingsSpinner').hide();
                        try {
                            const settingsP = JSON.parse(res.settings);
                            const settingsDataP = JSON.parse(res.settingsData);
                            settings = settingsP;
                            settingsData = settingsDataP;
                        } catch (e) {
                            // ignored
                        }
                        settingsDialog.hide();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                    },
                    onSaveError: () => {
                        $('.editSettingsForm-form-button').show();
                        $('#zoiaSettingsSpinner').hide();
                        $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    }
                },
                lang: formBuilderLang,
                items: {
                    weight: {
                        type: 'valueslistfixed',
                        values: getFormLangData(),
                        label: lang['Weight Description']
                    },
                    currency: {
                        type: 'valueslistfixed',
                        values: getFormLangData(),
                        label: lang['Currency Name']
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none;float:right" id="zoiaSettingsSpinner"></div>'
                    }
                }
            };
            const editPropertyFormData = {
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/save/property',
                    method: 'POST'
                },
                load: {
                    url: '/api/warehouse/load/property',
                    method: 'GET'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data, errors) => {
                        if ($('#editPropertyForm').zoiaFormBuilder().errors(errors)) {
                            return '__stop';
                        }
                        $('.editPropertyForm-form-button').hide();
                        $('#zoiaPropertyFormSpinner').show();
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('.editPropertyForm-form-button').show();
                        $('#zoiaPropertyFormSpinner').hide();
                        propertyEditDialog.hide();
                        $('#properties').zoiaTable().load();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                    },
                    onSaveError: (res) => {
                        $('.editPropertyForm-form-button').show();
                        $('#zoiaPropertyFormSpinner').hide();
                        if (res && res.status !== undefined) {
                            switch (res.status) {
                                case -1:
                                    $('#editPropertyForm_pid').addClass('za-form-danger');
                                    $zUI.notification(lang['Item not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                case -2:
                                    $('#editPropertyForm_pid').addClass('za-form-danger');
                                    $zUI.notification(lang['Item already exists in database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                default:
                                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                            }
                        }
                    },
                    onLoadSuccess: () => {
                        $('.zoiaPropertyEditDialogSpinner').hide();
                        $('.zoiaPropertyEditDialogWrap').show();
                    },
                    onLoadError: () => {
                        propertyEditDialog.hide().then(() => {
                            $('.zoiaPropertyEditDialogSpinner').hide();
                            $('.zoiaPropertyEditDialogWrap').show();
                            $zUI.notification(lang['Could not load information from database'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        });
                    }
                },
                lang: formBuilderLang,
                items: {
                    pid: {
                        type: 'text',
                        label: lang['ID'],
                        css: 'za-width-medium',
                        autofocus: true,
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: /^[A-Za-z0-9_\-]+$/,
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Latin characters and numbers only (1-64 chars)']
                    },
                    type: {
                        type: 'select',
                        label: lang['Type'],
                        css: 'za-form-width-small',
                        values: {
                            0: lang.types[0],
                            1: lang.types[1],
                            2: lang.types[2],
                            3: lang.types[3],
                            4: lang.types[4]
                        },
                        default: '0',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 1
                            },
                            regexp: /^(0|1|2|3|4)$/
                        }
                    },
                    title: {
                        type: 'valueslistfixed',
                        values: getFormLangData(),
                        label: lang['Title']
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none;float:right" id="zoiaPropertyFormSpinner"></div>'
                    }
                }
            };
            const editVariantFormData = {
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/save/variant',
                    method: 'POST'
                },
                load: {
                    url: '/api/warehouse/load/variant',
                    method: 'GET'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data, errors) => {
                        if ($('#editVariantForm').zoiaFormBuilder().errors(errors)) {
                            return '__stop';
                        }
                        $('.editVariantForm-form-button').hide();
                        $('#zoiaVariantFormSpinner').show();
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('.editVariantForm-form-button').show();
                        $('#zoiaVariantFormSpinner').hide();
                        variantEditDialog.hide();
                        $('#variants').zoiaTable().load();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                    },
                    onSaveError: (res) => {
                        $('.editVariantForm-form-button').show();
                        $('#zoiaVariantFormSpinner').hide();
                        if (res && res.status !== undefined) {
                            switch (res.status) {
                                case -1:
                                    $('#editVariantForm_pid').addClass('za-form-danger');
                                    $zUI.notification(lang['Item not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                case -2:
                                    $('#editVariantForm_pid').addClass('za-form-danger');
                                    $zUI.notification(lang['Item already exists in database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                default:
                                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                            }
                        }
                    },
                    onLoadSuccess: () => {
                        $('.zoiaVariantEditDialogSpinner').hide();
                        $('.zoiaVariantEditDialogWrap').show();
                    },
                    onLoadError: () => {
                        variantEditDialog.hide().then(() => {
                            $('.zoiaVariantEditDialogSpinner').hide();
                            $('.zoiaVariantEditDialogWrap').show();
                            $zUI.notification(lang['Could not load information from database'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        });
                    }
                },
                lang: formBuilderLang,
                items: {
                    pid: {
                        type: 'text',
                        label: lang['ID'],
                        css: 'za-width-medium',
                        autofocus: true,
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: /^[A-Za-z0-9_\-]+$/,
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Latin characters and numbers only (1-64 chars)']
                    },
                    title: {
                        type: 'valueslistfixed',
                        values: getFormLangData(),
                        label: lang['Title']
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none;float:right" id="zoiaVariantFormSpinner"></div>'
                    }
                }
            };
            const editDeliveryFormData = {
                template: {
                    fields: '<div class="za-modal-body">{fields}</div>',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/save/delivery',
                    method: 'POST'
                },
                load: {
                    url: '/api/warehouse/load/delivery',
                    method: 'GET'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data, errors) => {
                        if ($('#editDeliveryForm').zoiaFormBuilder().errors(errors)) {
                            return '__stop';
                        }
                        $('.editDeliveryForm-form-button').hide();
                        $('#zoiaDeliveryFormSpinner').show();
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('.editDeliveryForm-form-button').show();
                        $('#zoiaDeliveryFormSpinner').hide();
                        deliveryEditDialog.hide();
                        $('#delivery').zoiaTable().load();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                    },
                    onSaveError: (res) => {
                        $('.editDeliveryForm-form-button').show();
                        $('#zoiaDeliveryFormSpinner').hide();
                        if (res && res.status !== undefined) {
                            switch (res.status) {
                                case -1:
                                    $('#editDeliveryForm_pid').addClass('za-form-danger');
                                    $zUI.notification(lang['Item not found'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                case -2:
                                    $('#editDeliveryForm_pid').addClass('za-form-danger');
                                    $zUI.notification(lang['Item already exists in database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                                default:
                                    $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                                        status: 'danger',
                                        timeout: 1500
                                    });
                                    break;
                            }
                        }
                    },
                    onLoadSuccess: () => {
                        $('.zoiaDeliveryEditDialogSpinner').hide();
                        $('.zoiaDeliveryEditDialogWrap').show();
                    },
                    onLoadError: () => {
                        deliveryEditDialog.hide().then(() => {
                            $('.zoiaDeliveryEditDialogSpinner').hide();
                            $('.zoiaDeliveryEditDialogWrap').show();
                            $zUI.notification(lang['Could not load information from database'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        });
                    }
                },
                lang: formBuilderLang,
                items: {
                    pid: {
                        type: 'text',
                        label: lang['ID'],
                        css: 'za-width-medium',
                        autofocus: true,
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: /^[A-Za-z0-9_\-]+$/,
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Latin characters and numbers only (1-64 chars)']
                    },
                    title: {
                        type: 'valueslistfixed',
                        values: getFormLangData(),
                        label: lang['Title']
                    },
                    cost: {
                        type: 'text',
                        label: lang['Cost'],
                        css: 'za-width-small',
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: /^\d+(\.\d+)?$/,
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Example: 123.45']
                    },
                    cost_weight: {
                        type: 'text',
                        label: lang['Weight Cost'],
                        css: 'za-width-small',
                        validation: {
                            mandatoryCreate: false,
                            mandatoryEdit: false,
                            length: {
                                min: 1,
                                max: 64
                            },
                            regexp: /^\d+(\.\d+)?$/,
                            process: (item) => {
                                return item.trim();
                            }
                        },
                        helpText: lang['Example: 123.45']
                    },
                    delivery: {
                        type: 'select',
                        label: lang['Delivery'],
                        css: 'za-form-width-medium',
                        values: {
                            delivery: lang['Need to enter an address'],
                            pickup: lang['Local pickup']
                        },
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            regexp: /^(delivery|pickup)$/
                        }
                    },
                    status: {
                        type: 'select',
                        label: lang['Status'],
                        css: 'za-form-width-small',
                        values: {
                            0: lang.statuses[0],
                            1: lang.statuses[1]
                        },
                        default: '1',
                        validation: {
                            mandatoryCreate: true,
                            mandatoryEdit: true,
                            length: {
                                min: 1,
                                max: 1
                            },
                            regexp: /^(0|1|2)$/
                        }
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none;float:right" id="zoiaDeliveryFormSpinner"></div>'
                    }
                }
            };
            const editCollectionFormData = {
                template: {
                    fields: '<div class="za-modal-body" za-overflow-auto>{fields}</div>',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/save/collection',
                    method: 'POST'
                },
                load: {
                    url: '/api/warehouse/load/collection',
                    method: 'GET'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data, errors) => {
                        if ($('#editCollectionForm').zoiaFormBuilder().errors(errors)) {
                            return '__stop';
                        }
                        $('.editCollectionForm-form-button').hide();
                        $('#zoiaCollectionFormSpinner').show();
                        const properties = [];
                        $('.collectionFormDataItems').children().each(function() {
                            properties.push($(this).attr('data-pid'));
                        });
                        data.properties = properties;
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('.editCollectionForm-form-button').show();
                        $('#zoiaCollectionFormSpinner').hide();
                        collectionEditDialog.hide();
                        $('#collections').zoiaTable().load();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                    },
                    onSaveError: () => {
                        $('.editCollectionForm-form-button').show();
                        $('#zoiaCollectionFormSpinner').hide();
                        $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    },
                    onLoadSuccess: (data) => {
                        $('.zoiaCollectionEditDialogSpinner').hide();
                        $('.zoiaCollectionEditDialogWrap').show();
                        $('.collectionFormDataItems').html('');
                        for (let i in data.item.properties) {
                            $('.collectionFormDataItems').append('<div class="za-card za-card-default za-card-small za-card-body" data-pid="' + i + '"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span>' + data.item.properties[i] + '<button type="button" class="collectionPropertyItemClose" za-close style="float:right"></button></div>');
                        }
                        $('.collectionPropertyItemClose').click(function() {
                            $(this).parent().remove();
                        });
                        $('.editCollectionForm-title-item-val').first().focus();
                    },
                    onLoadError: () => {
                        collectionEditDialog.hide().then(() => {
                            $('.zoiaCollectionEditDialogSpinner').hide();
                            $('.zoiaCollectionEditDialogWrap').show();
                            $zUI.notification(lang['Could not load information from database'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        });
                    }
                },
                lang: formBuilderLang,
                items: {
                    title: {
                        type: 'valueslistfixed',
                        values: getFormLangData(),
                        label: lang['Title']
                    },
                    properties: {
                        type: 'launcher',
                        label: lang['Properties'],
                        labelBtn: lang['Add'],
                        value: '',
                        html: '<div class="collectionFormDataItems za-margin-top" za-sortable="handle: .za-sortable-handle"></div>',
                        data: 1
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none;float:right" id="zoiaCollectionFormSpinner"></div>'
                    }
                }
            };
            const editVariantCollectionFormData = {
                template: {
                    fields: '<div class="za-modal-body" za-overflow-auto>{fields}</div>',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/save/variantcollection',
                    method: 'POST'
                },
                load: {
                    url: '/api/warehouse/load/variantcollection',
                    method: 'GET'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data, errors) => {
                        if ($('#editVariantCollectionForm').zoiaFormBuilder().errors(errors)) {
                            return '__stop';
                        }
                        $('.editVariantCollectionForm-form-button').hide();
                        $('#zoiaVariantCollectionFormSpinner').show();
                        const properties = [];
                        $('.variantCollectionFormDataItems').children().each(function() {
                            properties.push($(this).attr('data-pid'));
                        });
                        data.properties = properties;
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('.editVariantCollectionForm-form-button').show();
                        $('#zoiaVariantCollectionFormSpinner').hide();
                        variantCollectionEditDialog.hide();
                        $('#variantscollections').zoiaTable().load();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                    },
                    onSaveError: () => {
                        $('.editVariantCollectionForm-form-button').show();
                        $('#zoiaVariantCollectionFormSpinner').hide();
                        $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    },
                    onLoadSuccess: (data) => {
                        $('.zoiaVariantCollectionEditDialogSpinner').hide();
                        $('.zoiaVariantCollectionEditDialogWrap').show();
                        $('.variantCollectionFormDataItems').html('');
                        for (let i in data.item.properties) {
                            $('.variantCollectionFormDataItems').append('<div class="za-card za-card-default za-card-small za-card-body" data-pid="' + i + '"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span>' + data.item.properties[i] + '<button type="button" class="variantCollectionPropertyItemClose" za-close style="float:right"></button></div>');
                        }
                        $('.variantCollectionPropertyItemClose').click(function() {
                            $(this).parent().remove();
                        });
                        $('.editVariantCollectionForm-title-item-val').first().focus();
                    },
                    onLoadError: () => {
                        variantCollectionEditDialog.hide().then(() => {
                            $('.zoiaVariantCollectionEditDialogSpinner').hide();
                            $('.zoiaVariantCollectionEditDialogWrap').show();
                            $zUI.notification(lang['Could not load information from database'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        });
                    }
                },
                lang: formBuilderLang,
                items: {
                    title: {
                        type: 'valueslistfixed',
                        values: getFormLangData(),
                        label: lang['Title']
                    },
                    properties: {
                        type: 'launcher',
                        label: lang['Properties'],
                        labelBtn: lang['Add'],
                        value: '',
                        html: '<div class="variantCollectionFormDataItems za-margin-top" za-sortable="handle: .za-sortable-handle"></div>',
                        data: 1
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none;float:right" id="zoiaVariantCollectionFormSpinner"></div>'
                    }
                }
            };
            const editAddressFormData = {
                template: {
                    fields: '<div class="za-modal-body" za-overflow-auto>{fields}</div>',
                    buttons: '{buttons}'
                },
                save: {
                    url: '/api/warehouse/save/address',
                    method: 'POST'
                },
                load: {
                    url: '/api/warehouse/load/address',
                    method: 'GET'
                },
                formDangerClass: 'za-form-danger',
                html: formBuilderHTML,
                events: {
                    onSaveValidate: (data, errors) => {
                        if ($('#editAddressForm').zoiaFormBuilder().errors(errors)) {
                            return '__stop';
                        }
                        $('.editAddressForm-form-button').hide();
                        $('#zoiaAddressFormSpinner').show();
                        const properties = [];
                        $('.addressFormDataItems').children().each(function() {
                            const id = $(this).attr('data-pid');
                            const m = $('#za_address_cbx_' + id).is(':checked') ? 'm' : 'o';
                            properties.push(id + '|' + m);
                        });
                        data.properties = properties;
                        data.template = $('#editAddressForm_template').val().trim();
                        data.id = currentEditID;
                        return data;
                    },
                    onSaveSuccess: () => {
                        $('.editAddressForm-form-button').show();
                        $('#zoiaAddressFormSpinner').hide();
                        addressEditDialog.hide();
                        $zUI.notification(lang.fieldErrors['Saved successfully'], {
                            status: 'success',
                            timeout: 1500
                        });
                    },
                    onSaveError: () => {
                        $('.editAddressForm-form-button').show();
                        $('#zoiaAddressFormSpinner').hide();
                        $zUI.notification(lang.fieldErrors['Could not save to the database'], {
                            status: 'danger',
                            timeout: 1500
                        });
                    },
                    onLoadSuccess: (data) => {
                        $('.zoiaAddressEditDialogSpinner').hide();
                        $('.zoiaAddressEditDialogWrap').show();
                        $('.addressFormDataItems').html('');
                        if (data && data.item && data.item.data) {
                            for (let i in data.item.data) {
                                let item = data.item.data[i];
                                let [aid, af] = item.split('|');
                                let title = item;
                                for (let a in addressData) {
                                    if (addressData[a].id === aid) {
                                        title = addressData[a].title[locale];
                                        break;
                                    }
                                }
                                $('.addressFormDataItems').append('<div class="za-card za-card-default za-card-small za-card-body" data-pid="' + aid + '"><span class="za-sortable-handle za-margin-small-right" za-icon="icon: table"></span>' + title + '&nbsp;&ndash;&nbsp;' + aid + '&nbsp;<label><input type="checkbox" class="za-checkbox" id="za_address_cbx_' + aid + '"' + (af === 'm' ? ' checked' : '') + '>&nbsp;*</label><button type="button" class="addressItemClose" za-close style="float:right"></button></div>');
                            }
                            $('#editAddressForm_template').val(data.template.data);
                        }
                        $('.addressItemClose').unbind();
                        $('.addressItemClose').click(function() {
                            $(this).parent().remove();
                        });
                        $('.editAddressForm-title-item-val').first().focus();
                    },
                    onLoadError: () => {
                        addressEditDialog.hide().then(() => {
                            $('.zoiaAddressEditDialogSpinner').hide();
                            $('.zoiaAddressEditDialogWrap').show();
                            $zUI.notification(lang['Could not load information from database'], {
                                status: 'danger',
                                timeout: 1500
                            });
                        });
                    }
                },
                lang: formBuilderLang,
                items: {
                    properties: {
                        type: 'launcher',
                        label: lang['Address lines'],
                        labelBtn: lang['Add'],
                        value: '',
                        html: '<div class="addressFormDataItems za-margin-top" za-sortable="handle: .za-sortable-handle"></div>',
                        data: 1
                    },
                    template: {
                        type: 'textarea',
                        label: lang['Address Template'],
                        css: 'za-address-textarea',
                        value: ''
                    },
                    buttons: {
                        type: 'buttons',
                        css: 'za-modal-footer za-text-right',
                        buttons: [{
                            label: lang['Cancel'],
                            css: 'za-button-default za-modal-close'
                        }, {
                            name: 'btnSave',
                            label: lang['Save'],
                            css: 'za-button-primary',
                            type: 'submit'
                        }],
                        html: '<div za-spinner style="display:none;float:right" id="zoiaAddressFormSpinner"></div>'
                    }
                }
            };
            const warehouseTableData = {
                url: '/api/warehouse/list',
                limit: 20,
                sort: {
                    field: 'sku',
                    direction: 'asc'
                },
                fields: {
                    sku: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    folder: {
                        sortable: true,
                        process: (id, item, value) => {
                            let path = treePath(foldersData, value);
                            if (path) {
                                path = path.reverse().join('/').replace('//', '');
                                if (path.length > 1) {
                                    path += '/';
                                }
                                let result = '';
                                if (path) {
                                    result = '<div class="zoia-folder-column" title="' + path + '">' + path + '</div>';
                                } else {
                                    result = '<span za-icon="icon:ban"></span>';
                                }
                                return result;
                            }
                            return '<span za-icon="icon:ban"></span>';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    price: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || lang['Free'];
                        }
                    },
                    status: {
                        sortable: true,
                        process: (id, item, value) => {
                            return lang.statuses[value] || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-warehouse-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-warehouse-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-warehouse-action-edit-btn').click(function() {
                        window.history.pushState({ action: 'edit', id: $(this).attr('data') }, document.title, uprefix + corePrefix.admin + '/warehouse?action=edit&id=' + $(this).attr('data'));
                        editItem($(this).attr('data'));
                    });
                    $('.zoia-warehouse-action-del-btn').click(function() {
                        deleteItem($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const ordersTableData = {
                url: '/api/warehouse/orders/list',
                limit: 20,
                sort: {
                    field: '_id',
                    direction: 'desc'
                },
                fields: {
                    _id: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value;
                        }
                    },
                    date: {
                        sortable: true,
                        process: (id, item, value) => {
                            const date = new Date(value * 1000);
                            return date.toLocaleString();
                        }
                    },
                    username: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    costs: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value.total || '&ndash;';
                        }
                    },
                    status: {
                        sortable: true,
                        process: (id, item, value) => {
                            return lang.orderStatuses[value] || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-orders-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-orders-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-orders-action-edit-btn').click(function() {
                        editOrder($(this).attr('data'));
                    });
                    $('.zoia-orders-action-del-btn').click(function() {
                        deleteOrder($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const propertiesTableData = {
                url: '/api/warehouse/list/properties',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    pid: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-properties-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-properties-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-properties-action-edit-btn').click(function() {
                        editProperty($(this).attr('data'));
                    });
                    $('.zoia-properties-action-del-btn').click(function() {
                        deleteProperty($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const variantsTableData = {
                url: '/api/warehouse/list/variants',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    pid: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-variants-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-variants-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-variants-action-edit-btn').click(function() {
                        editVariant($(this).attr('data'));
                    });
                    $('.zoia-variants-action-del-btn').click(function() {
                        deleteVariant($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const deliveryTableData = {
                url: '/api/warehouse/list/delivery',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    pid: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-delivery-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-delivery-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-delivery-action-edit-btn').click(function() {
                        editDelivery($(this).attr('data'));
                    });
                    $('.zoia-delivery-action-del-btn').click(function() {
                        deleteDelivery($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const collectionsTableData = {
                url: '/api/warehouse/list/collections',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-collections-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-collections-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-collections-action-edit-btn').click(function() {
                        editCollection($(this).attr('data'));
                    });
                    $('.zoia-collections-action-del-btn').click(function() {
                        deleteCollection($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const variantsCollectionsTableData = {
                url: '/api/warehouse/list/variantscollections',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-variantscollections-action-edit-btn" za-icon="icon: pencil" data="' + item._id +
                                '" style="margin-right:5px"></button><button class="za-icon-button zoia-variantscollections-action-del-btn" za-icon="icon: trash" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-variantscollections-action-edit-btn').click(function() {
                        editVariantCollection($(this).attr('data'));
                    });
                    $('.zoia-variantscollections-action-del-btn').click(function() {
                        deleteVariantCollection($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const collectionselectTableData = {
                url: '/api/warehouse/list/collections',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-collectionselect-action-check-btn" za-icon="icon: check" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-collectionselect-action-check-btn').click(function() {
                        selectCheckedCollection($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const variantcollectionselectTableData = {
                url: '/api/warehouse/list/variantscollections',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-variantcollectionselect-action-check-btn" za-icon="icon: check" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-variantcollectionselect-action-check-btn').click(function() {
                        selectCheckedVariantCollection($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const variantselectTableData = {
                url: '/api/warehouse/list/variants',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-variantselect-action-check-btn" za-icon="icon: check" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-variantselect-action-check-btn').click(function() {
                        addCheckedVariants($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const variantsselectTableData = {
                url: '/api/warehouse/list/variants',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-variantsselect-action-check-btn" za-icon="icon: check" data="' + item._id +
                                '"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-variantsselect-action-check-btn').click(function() {
                        selectCheckedVariants($(this).attr('data'));
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const propertyselectTableData = {
                url: '/api/warehouse/list/properties',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    pid: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-propertyselect-action-check-btn" za-icon="icon: check" data="' + item._id +
                                '" style="margin-right:5px"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-propertyselect-action-check-btn').click(function() {
                        addCheckedProperties([$(this).attr('data')]);
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            const propertiesselectTableData = {
                url: '/api/warehouse/list/properties',
                limit: 7,
                sort: {
                    field: 'title',
                    direction: 'asc'
                },
                fields: {
                    pid: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    title: {
                        sortable: true,
                        process: (id, item, value) => {
                            return value || '&ndash;';
                        }
                    },
                    actions: {
                        sortable: false,
                        process: (id, item) => {
                            return '<button class="za-icon-button zoia-propertiesselect-action-check-btn" za-icon="icon: check" data="' + item._id +
                                '" style="margin-right:5px"></button><div style="margin-bottom:17px" class="za-hidden@m">&nbsp;</div>';
                        }
                    }
                },
                onLoad: () => {
                    $('.zoia-propertiesselect-action-check-btn').click(function() {
                        selectCheckedProperties([$(this).attr('data')]);
                    });
                },
                lang: {
                    error: lang['Could not load data from server. Please try to refresh page in a few moments.'],
                    noitems: lang['No items to display']
                }
            };
            // Init section
            initDialogs();
            initFoldersTree();
            initCKEditor();
            initUploader();
            initEditLanguages();
            initImportPropertiesUploader();
            initImportCollectionsUploader();
            initImportVariantsUploader();
            initImportVariantsCollectionsUploader();
            initAddressSelect();
            initOrderDialogFields();
            // Forms and tables
            $('#editForm').zoiaFormBuilder(editFormData);
            $('#editFolderForm').zoiaFormBuilder(editFolderFormData);
            $('#editSettingsForm').zoiaFormBuilder(editSettingsFormData);
            $('#editPropertyForm').zoiaFormBuilder(editPropertyFormData);
            $('#editVariantForm').zoiaFormBuilder(editVariantFormData);
            $('#editDeliveryForm').zoiaFormBuilder(editDeliveryFormData);
            $('#editCollectionForm').zoiaFormBuilder(editCollectionFormData);
            $('#editVariantCollectionForm').zoiaFormBuilder(editVariantCollectionFormData);
            $('#editAddressForm').zoiaFormBuilder(editAddressFormData);
            $('#warehouse').zoiaTable(warehouseTableData);
            $('#orders').zoiaTable(ordersTableData);
            $('#properties').zoiaTable(propertiesTableData);
            $('#variants').zoiaTable(variantsTableData);
            $('#collections').zoiaTable(collectionsTableData);
            $('#variantscollections').zoiaTable(variantsCollectionsTableData);
            $('#propertyselect').zoiaTable(propertyselectTableData);
            $('#variantselect').zoiaTable(variantselectTableData);
            $('#propertiesselect').zoiaTable(propertiesselectTableData);
            $('#collectionselect').zoiaTable(collectionselectTableData);
            $('#variantcollectionselect').zoiaTable(variantcollectionselectTableData);
            $('#variantsselect').zoiaTable(variantsselectTableData);
            $('#delivery').zoiaTable(deliveryTableData);
            // Handlers    
            $('.zoiaDeleteButton').click(deleteButtonHanlder);
            $('.zoiaPropertyDeleteButton').click(deletePropertyButtonHanlder);
            $('.zoiaVariantDeleteButton').click(deleteVariantButtonHanlder);
            $('.zoiaOrderDeleteButton').click(deleteOrderButtonHanlder);
            $('.zoiaCollectionDeleteButton').click(deleteCollectionButtonHanlder);
            $('.zoiaVariantCollectionDeleteButton').click(deleteVariantCollectionButtonHanlder);
            $('#zoiaDeleteDialogButton').click(ajaxDeleteItem);
            $('#zoiaDeletePropertyDialogButton').click(ajaxDeleteProperty);
            $('#zoiaDeleteVariantDialogButton').click(ajaxDeleteVariant);
            $('#zoiaDeleteOrderDialogButton').click(ajaxDeleteOrder);
            $('#zoiaDeleteCollectionDialogButton').click(ajaxDeleteCollection);
            $('#zoiaDeleteVariantCollectionDialogButton').click(ajaxDeleteVariantCollection);
            $('#zoiaRepairDialogButton').click(ajaxRepairDatabase);
            $('.zoiaAdd').click(addHandler);
            $('.zoiaPropertyAdd').click(addPropertyHandler);
            $('.zoiaVariantAdd').click(addVariantHandler);
            $('.zoiaCollectionAdd').click(addCollectionHandler);
            $('.zoiaVariantCollectionAdd').click(addVariantCollectionHandler);
            $('.zoiaDeliveryAdd').click(addDeliveryHandler);
            $('#editForm_folder_btn').click(editFormFolderBtnHandler);
            $('#zoiaFoldersAdd').click(foldersAddHandler);
            $('#zoiaFoldersEdit').click(foldersEditHanlder);
            $('#zoiaFoldersDelete').click(foldersDeleteHandler);
            $('#zoiaFoldersRevert').click(foldersRevertHandler);
            $('#zoiaFoldersDialogButton').click(foldersDialogButtonHandler);
            $('#editForm_btnCancel').click(editFormBtnCancelHandler);
            $('#zoiaEditLanguageCheckbox').click(onEditLanguageCheckboxClickEvent);
            $('.warehouseBtnRepair').click(warehouseBtnRepairHandler);
            $('.warehouseBtnRebuild').click(ajaxRebuildDatabase);
            $('.warehouseBtnSettingsDialog').click(warehouseBtnSettingsDialogHandler);
            $('.warehouseBtnPropertiesListDialog').click(warehouseBtnPropertiesListDialogHandler);
            $('.warehouseBtnVariantsListDialog').click(warehouseBtnVariantsListDialogHandler);
            $('.warehouseBtnCollectionsListDialog').click(warehouseBtnCollectionsListDialogHandler);
            $('.warehouseBtnVariantsCollectionsListDialog').click(warehouseBtnVariantsCollectionsListDialogHandler);
            $('#editForm_images_btn').click(editFormImagesBtnHandler);
            $('#zoiaImagesDialogBtnClose').click(imagesDialogCloseHandler);
            $('#imagesListBtnDel').click(imagesListBtnDelHandler);
            $('#zoiaEditLanguages > li').click(function() {
                onZoiaEditLanguagesClick($(this).attr('data'));
            });
            $('#editCollectionForm_properties_btn').click(editCollectionForm_properties_btnHandler);
            $('#editVariantCollectionForm_properties_btn').click(editVariantCollectionForm_properties_btnHandler);
            $('.zoiaPropertySelect').click(zoiaPropertySelectHandler);
            $('.zoiaSelectedPropertyAdd').click(zoiaSelectedPropertyAddHandler);
            $('.zoiaSelectedVariantAdd').click(zoiaSelectedVariantAddHandler);
            $('.zoiaAddPropertyBtn').click(zoiaAddPropertyBtnClick);
            $('.zoiaAddVariantBtn').click(zoiaAddVariantBtnClick);
            $('#zoiaPropertiesSelectDialogCloseBtn').click(zoiaPropertiesSelectDialogCloseBtnClick);
            $('#zoiaVariantsSelectDialogCloseBtn').click(zoiaVariantsSelectDialogCloseBtnClick);
            $('.zoiaAddCollectionBtn').click(zoiaAddCollectionBtnClick);
            $('.zoiaAddVariantCollectionBtn').click(zoiaAddVariantCollectionBtnClick);
            $('.zoiaRemoveAllProperties').click(() => {
                $('#editForm_properties_wrap').empty();
            });
            $('.zoiaPropertiesCopyNumeric').click(zoiaPropertiesCopyNumericClick);
            $('.zoiaPropertiesSyncNumeric').click(zoiaPropertiesSyncNumericClick);
            $('.zoiaRemoveAllVariants').click(() => {
                $('#editForm_variants_wrap').empty();
            });
            $('.zoiaPropertiesImportButton').click(zoiaPropertiesImportButtonClick);
            $('.zoiaVariantsImportButton').click(zoiaVariantsImportButtonClick);
            $('.zoiaVariantsCollectionsImportButton').click(zoiaVariantsCollectionsImportButtonClick);
            $('.zoiaCollectionsImportButton').click(zoiaCollectionsImportButtonClick);
            $('.warehouseBtnDeliveryDialog').click(warehouseBtnDeliveryDialogClick);
            $('.warehouseBtnAddressDialog').click(warehouseBtnAddressDialogClick);
            $('#editAddressForm_properties_btn').click(editAddressForm_properties_btnClick);
            $('#btnAddressAdd').click(btnAddressAddClick);
            $('#za_catalog_order_btn_add').click(za_catalog_order_btn_addClick);
            $('#za_catalog_order_add_form').submit(function(e) {
                e.preventDefault();
                za_catalog_order_btn_addClick();
            });
            $('#za_catalog_order_btn_cost_add').click(za_catalog_order_btn_addCostClick);
            $('#za_catalog_order_add_cost_form').submit(function(e) {
                e.preventDefault();
            });
            $('#zoiaOrderDialogButton').click(zoiaOrderDialogButtonClick);
            $('#zoiaOrderDialogReturn').click(zoiaOrderDialogReturnClick);
            $('.warehouseBtnRefresh').click(warehouseBtnRefreshClick);
            $('.ordersBtnRefresh').click(ordersBtnRefreshClick);
            $('#zoiaOrderAddOptionsAdd').click(zoiaOrderAddOptionsAddClick);
            $('.zoia-admin-loading').hide();
            $('#zoia_admin_panel_wrap').show();
        });
    });
})();