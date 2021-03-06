import template from './sw-settings-shipping-list.html.twig';
import './sw-settings-shipping-list.scss';

const { Component, Mixin, Data: { Criteria } } = Shopware;

Component.register('sw-settings-shipping-list', {
    template,

    inject: ['repositoryFactory', 'acl', 'feature'],

    mixins: [
        Mixin.getByName('listing'),
        Mixin.getByName('notification')
    ],

    data() {
        return {
            shippingMethods: null,
            isLoading: false,
            sortBy: 'name',
            sortDirection: 'ASC',
            skeletonItemAmount: 3,
            showDeleteModal: false
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle()
        };
    },

    computed: {
        shippingRepository() {
            return this.repositoryFactory.create('shipping_method');
        },

        columns() {
            let columns = [{
                property: 'name',
                label: 'sw-settings-shipping.list.columnName',
                inlineEdit: 'string',
                routerLink: 'sw.settings.shipping.detail',
                allowResize: true,
                primary: true
            }, {
                property: 'description',
                label: 'sw-settings-shipping.list.columnDescription',
                inlineEdit: 'string',
                allowResize: true
            }, {
                property: 'active',
                label: 'sw-settings-shipping.list.columnActive',
                inlineEdit: 'boolean',
                allowResize: true,
                align: 'center'
            }];

            if (this.feature.isActive('FEATURE_NEXT_6995')) {
                columns = [...columns, {
                    property: 'taxType',
                    label: 'sw-settings-shipping.list.columnTaxType',
                    inlineEdit: 'string',
                    allowResize: true
                }];
            }

            return columns;
        },

        listingCriteria() {
            const criteria = new Criteria();

            if (this.term) {
                criteria.setTerm(this.term);
            }

            criteria.addSorting(
                Criteria.sort('name', 'ASC')
            );

            return criteria;
        },

        shippingCostTaxOptions() {
            return [{
                label: this.$tc('sw-settings-shipping.shippingCostOptions.auto'),
                value: 'auto'
            }, {
                label: this.$tc('sw-settings-shipping.shippingCostOptions.highest'),
                value: 'highest'
            }, {
                label: this.$tc('sw-settings-shipping.shippingCostOptions.fixed'),
                value: 'fixed'
            }];
        }
    },

    methods: {
        getList() {
            this.isLoading = true;
            this.shippingRepository.search(this.listingCriteria, Shopware.Context.api).then((items) => {
                this.total = items.total;
                this.shippingMethods = items;

                return items;
            }).finally(() => {
                this.isLoading = false;
            });
        },

        onInlineEditSave(item) {
            this.isLoading = true;
            const name = item.name || item.translated.name;

            return this.entityRepository.save(item, Shopware.Context.api)
                .then(() => {
                    this.createNotificationSuccess({
                        message: this.$tc('sw-settings-shipping.list.messageSaveSuccess', 0, { name })
                    });
                }).catch(() => {
                    this.createNotificationError({
                        message: this.$tc('sw-settings-shipping.list.messageSaveError', 0, { name })
                    });
                }).finally(() => {
                    this.isLoading = false;
                });
        },

        onDelete(id) {
            this.showDeleteModal = id;
        },

        onConfirmDelete(id) {
            const name = this.shippingMethods.find((item) => item.id === id).name;

            this.onCloseDeleteModal();
            this.shippingRepository.delete(id, Shopware.Context.api)
                .then(() => {
                    this.createNotificationSuccess({
                        message: this.$tc('sw-settings-shipping.list.messageDeleteSuccess', 0, { name })
                    });
                }).catch(() => {
                    this.createNotificationError({
                        message: this.$tc('sw-settings-shipping.list.messageDeleteError', 0, { name })
                    });
                }).finally(() => {
                    this.showDeleteModal = null;
                    this.getList();
                });
        },

        onCloseDeleteModal() {
            this.showDeleteModal = false;
        },

        onChangeLanguage(languageId) {
            Shopware.State.commit('context/setApiLanguageId', languageId);
            this.getList();
        },

        shippingTaxTypeLabel(taxName) {
            if (!taxName) {
                return '';
            }

            const tax = this.shippingCostTaxOptions.find((i) => taxName === i.value) || '';

            return tax && tax.label;
        }
    }
});
