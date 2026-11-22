'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  countWooCommerceProducts,
  importWooCommerceProductsBatch,
  importWooCommerceCategories,
  fetchWooCommerceCategoriesList,
  fetchWooCommerceProductsList,
  importWooCommerceSelectedProducts,
  testWooCommerceConnection,
  importWooCommerceOrders,
  importWordPressPages,
  importWordPressArticles,
  importWooCommerceShipping,
  importWooCommerceReviews,
  syncWooCommerceRankMathSEO,
  importWooCommerceCsv,
  importFrankhFullBackup,
  importBackupShipping,
  importBackupPages,
  importBackupArticles,
  importBackupReviews,
  importBackupOrders,
  importBackupProductsBatch,
  finalizeBackupImport,
  type WcProductImportItemResult
} from '@/actions/woocommerce';

type ImportMode = 'ALL' | 'CATEGORIES' | 'INDIVIDUAL' | 'SEO_SYNC';
type FilterTab = 'ALL' | 'FAILED' | 'ALREADY_EXISTS' | 'SUCCESS';

export default function WooCommerceImportModal() {
  const t = useTranslations('AdminProducts');
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingRemote, setFetchingRemote] = useState(false);

  // Credentials
  const [url, setUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [credentialsVerified, setCredentialsVerified] = useState(false);

  // Mode
  const [importMode, setImportMode] = useState<ImportMode>('ALL');

  // Additional Data To Import
  const [includeShipping, setIncludeShipping] = useState(true);
  const [includeOrders, setIncludeOrders] = useState(true);
  const [includePages, setIncludePages] = useState(true);
  const [includeArticles, setIncludeArticles] = useState(true);
  const [includeReviews, setIncludeReviews] = useState(true);

  // Additional Imported Stats for Summary
  const [shippingSummary, setShippingSummary] = useState<{ zones: number; methods: number } | null>(null);
  const [ordersImportedCount, setOrdersImportedCount] = useState<number | null>(null);
  const [pagesImportedCount, setPagesImportedCount] = useState<number | null>(null);
  const [articlesImportedCount, setArticlesImportedCount] = useState<number | null>(null);
  const [reviewsImportedCount, setReviewsImportedCount] = useState<number | null>(null);

  // Step Tracker
  const [currentStep, setCurrentStep] = useState<string>('IDLE');
  const [currentStepText, setCurrentStepText] = useState<string>('');

  // Categories Selection State
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string; count: number; slug: string }>>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Individual Products State
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: number; name: string; price: string; image: string | null; categories: string[]; alreadyImported: boolean }>>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [totalRemoteProducts, setTotalRemoteProducts] = useState(0);
  const [totalRemotePages, setTotalRemotePages] = useState(0);

  // Results & Progress
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [importingCategories, setImportingCategories] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [importedProducts, setImportedProducts] = useState(0);

  // Live import tracking
  const [importLogs, setImportLogs] = useState<WcProductImportItemResult[]>([]);
  const [liveSuccessCount, setLiveSuccessCount] = useState(0);
  const [liveAlreadyExistsCount, setLiveAlreadyExistsCount] = useState(0);
  const [liveFailedCount, setLiveFailedCount] = useState(0);
  const [liveTabFilter, setLiveTabFilter] = useState<FilterTab>('ALL');
  const liveLogsEndRef = useRef<HTMLDivElement>(null);

  // Completion summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    success: 0,
    alreadyExists: 0,
    failed: 0,
    total: 0
  });
  const [summaryTabFilter, setSummaryTabFilter] = useState<FilterTab>('ALL');
  const [summarySearch, setSummarySearch] = useState('');
  const [copiedErrors, setCopiedErrors] = useState(false);

  // Source Method: API REST vs Direct File Upload (JSON or CSV)
  const [sourceTab, setSourceTab] = useState<'API' | 'CSV'>('API');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvProductsCount, setCsvProductsCount] = useState<number | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    isJson: boolean;
    productsCount: number;
    reviewsCount?: number;
    ordersCount?: number;
    pagesCount?: number;
    articlesCount?: number;
    shippingCount?: number;
  } | null>(null);
  const [showCsvOption, setShowCsvOption] = useState(false);

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvFileName(file.name);
    setResultMessage(null);

    try {
      const text = await file.text();
      if (file.name.endsWith('.json') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        const pCount = Array.isArray(parsed.products) ? parsed.products.length : 0;
        setCsvProductsCount(pCount);
        setFileMeta({
          isJson: true,
          productsCount: pCount,
          reviewsCount: Array.isArray(parsed.reviews) ? parsed.reviews.length : 0,
          ordersCount: Array.isArray(parsed.orders) ? parsed.orders.length : 0,
          pagesCount: Array.isArray(parsed.pages) ? parsed.pages.length : 0,
          articlesCount: Array.isArray(parsed.articles) ? parsed.articles.length : 0,
          shippingCount: Array.isArray(parsed.shipping) ? parsed.shipping.length : 0,
        });
      } else {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const count = Math.max(0, lines.length - 1);
        setCsvProductsCount(count);
        setFileMeta({
          isJson: false,
          productsCount: count
        });
      }
    } catch {
      setCsvProductsCount(null);
      setFileMeta(null);
    }
  };

  const handleStartCsvImport = async () => {
    if (!csvFile) return;
    setLoading(true);
    setResultMessage(null);
    setCurrentStep('FILE_PARSING');
    setCurrentStepText('Lecture et analyse du fichier...');

    try {
      const text = await csvFile.text();
      const isJson = csvFile.name.endsWith('.json') || text.trim().startsWith('{');

      if (isJson) {
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch (err: any) {
          setResultMessage({ type: 'error', text: 'Format JSON invalide : ' + err.message });
          setLoading(false);
          return;
        }

        // Reset live counters
        setLiveSuccessCount(0);
        setLiveAlreadyExistsCount(0);
        setLiveFailedCount(0);
        setImportLogs([]);

        // 1. Livraison
        if (Array.isArray(parsed.shipping) && parsed.shipping.length > 0) {
          setCurrentStep('SHIPPING');
          setCurrentStepText('Importation des zones et tarifs de livraison...');
          try {
            const sRes = await importBackupShipping(parsed.shipping);
            if (sRes.shippingSummary) setShippingSummary(sRes.shippingSummary);
          } catch { }
        }

        // 2. Pages
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          setCurrentStep('PAGES');
          setCurrentStepText(`Importation des pages institutionnelles (0 / ${parsed.pages.length})...`);
          const PAGE_BATCH = 10;
          let pDone = 0;
          for (let i = 0; i < parsed.pages.length; i += PAGE_BATCH) {
            const batch = parsed.pages.slice(i, i + PAGE_BATCH);
            try {
              const res = await importBackupPages(batch);
              pDone += res.count || 0;
              setPagesImportedCount(pDone);
              setCurrentStepText(`Importation des pages : ${pDone} / ${parsed.pages.length}`);
            } catch { }
          }
        }

        // 3. Articles de blog
        if (Array.isArray(parsed.articles) && parsed.articles.length > 0) {
          setCurrentStep('ARTICLES');
          setCurrentStepText(`Importation des articles de blog (0 / ${parsed.articles.length})...`);
          const ART_BATCH = 5;
          let aDone = 0;
          for (let i = 0; i < parsed.articles.length; i += ART_BATCH) {
            const batch = parsed.articles.slice(i, i + ART_BATCH);
            try {
              const res = await importBackupArticles(batch);
              aDone += res.count || 0;
              setArticlesImportedCount(aDone);
              setCurrentStepText(`Importation des articles de blog : ${aDone} / ${parsed.articles.length}`);
            } catch { }
          }
        }

        // 4. Produits, Variantes & SEO (en micro-lots pour éviter tout timeout)
        const allProducts = Array.isArray(parsed.products) ? parsed.products : [];
        const allResults: WcProductImportItemResult[] = [];
        let totalSuccess = 0;
        let totalAlreadyExists = 0;
        let totalFailed = 0;

        if (allProducts.length > 0) {
          setCurrentStep('PRODUCTS');
          setTotalProducts(allProducts.length);
          setImportedProducts(0);
          const PROD_BATCH = 20;

          for (let i = 0; i < allProducts.length; i += PROD_BATCH) {
            const batch = allProducts.slice(i, i + PROD_BATCH);
            const currentNumber = Math.min(i + PROD_BATCH, allProducts.length);
            setCurrentStepText(`Importation des produits : ${currentNumber} / ${allProducts.length} (SEO & Cloudinary)...`);

            try {
              const bRes = await importBackupProductsBatch(batch);
              if (bRes.results && bRes.results.length > 0) {
                allResults.push(...bRes.results);
                setImportLogs(prev => [...prev, ...bRes.results]);
              }
              totalSuccess += bRes.importedCount || 0;
              totalAlreadyExists += bRes.alreadyExistsCount || 0;
              totalFailed += bRes.failedCount || 0;

              setLiveSuccessCount(totalSuccess);
              setLiveAlreadyExistsCount(totalAlreadyExists);
              setLiveFailedCount(totalFailed);
              setImportedProducts(allResults.length);
            } catch (batchErr: any) {
              console.error('Batch error:', batchErr);
            }
          }
        }

        // 5. Avis clients
        if (Array.isArray(parsed.reviews) && parsed.reviews.length > 0) {
          setCurrentStep('REVIEWS');
          setCurrentStepText(`Importation des avis clients (0 / ${parsed.reviews.length})...`);
          const REV_BATCH = 50;
          let rDone = 0;
          for (let i = 0; i < parsed.reviews.length; i += REV_BATCH) {
            const batch = parsed.reviews.slice(i, i + REV_BATCH);
            try {
              const res = await importBackupReviews(batch);
              rDone += res.count || 0;
              setReviewsImportedCount(rDone);
              setCurrentStepText(`Importation des avis clients : ${rDone} / ${parsed.reviews.length}`);
            } catch { }
          }
        }

        // 6. Commandes clients
        if (Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          setCurrentStep('ORDERS');
          setCurrentStepText(`Importation des commandes clients (0 / ${parsed.orders.length})...`);
          const ORD_BATCH = 25;
          let oDone = 0;
          for (let i = 0; i < parsed.orders.length; i += ORD_BATCH) {
            const batch = parsed.orders.slice(i, i + ORD_BATCH);
            try {
              const res = await importBackupOrders(batch);
              oDone += res.count || 0;
              setOrdersImportedCount(oDone);
              setCurrentStepText(`Importation des commandes : ${oDone} / ${parsed.orders.length}`);
            } catch { }
          }
        }

        // 7. Finalisation & Revalidation du cache
        await finalizeBackupImport().catch(() => { });

        setCurrentStep('DONE');
        setCurrentStepText('Importation complète terminée avec succès !');

        setSummaryStats({
          success: totalSuccess,
          alreadyExists: totalAlreadyExists,
          failed: totalFailed,
          total: allResults.length
        });
        setSummaryTabFilter(totalFailed > 0 ? 'FAILED' : 'ALL');
        setShowSummaryModal(true);
        return;
      }

      // Otherwise, process as CSV
      setCurrentStep('PRODUCTS');
      setCurrentStepText('Importation des produits, variantes et médias Cloudinary...');

      const res = await importWooCommerceCsv(text);
      if (!res.success) {
        setResultMessage({ type: 'error', text: res.message || 'Erreur lors du traitement du fichier CSV.' });
        setLoading(false);
        return;
      }

      const items = res.results || [];
      setImportLogs(items);
      setLiveSuccessCount(res.successCount || 0);
      setLiveAlreadyExistsCount(res.alreadyExistsCount || 0);
      setLiveFailedCount(res.failedCount || 0);
      setTotalProducts(res.total || items.length);
      setImportedProducts(items.length);

      setCurrentStep('DONE');
      setCurrentStepText('Importation CSV terminée avec succès !');

      setSummaryStats({
        success: res.successCount || 0,
        alreadyExists: res.alreadyExistsCount || 0,
        failed: res.failedCount || 0,
        total: items.length
      });
      setSummaryTabFilter((res.failedCount || 0) > 0 ? 'FAILED' : 'ALL');
      setShowSummaryModal(true);
    } catch (err: any) {
      setResultMessage({ type: 'error', text: err.message || 'Erreur lors de l\'import' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll live logs during import
  useEffect(() => {
    if (loading && liveLogsEndRef.current) {
      liveLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [importLogs, loading]);

  const resetModal = () => {
    setLoading(false);
    setFetchingRemote(false);
    setResultMessage(null);
    setImportingCategories(false);
    setTotalProducts(0);
    setImportedProducts(0);
    setImportLogs([]);
    setLiveSuccessCount(0);
    setLiveAlreadyExistsCount(0);
    setLiveFailedCount(0);
    setLiveTabFilter('ALL');
    setShowSummaryModal(false);
    setShippingSummary(null);
    setOrdersImportedCount(null);
    setPagesImportedCount(null);
    setArticlesImportedCount(null);
    setReviewsImportedCount(null);
    setCurrentStep('IDLE');
    setCurrentStepText('');
    setCsvFile(null);
    setCsvFileName('');
    setCsvProductsCount(null);
  };

  // Step 1: Connect and load categories / products metadata
  const handleConnectAndFetch = async () => {
    if (!url || !consumerKey || !consumerSecret) return;
    setFetchingRemote(true);
    setResultMessage(null);

    try {
      const test = await testWooCommerceConnection(url, consumerKey, consumerSecret);
      if (!test.success) {
        setResultMessage({ type: 'error', text: test.message });
        setFetchingRemote(false);
        return;
      }

      setCredentialsVerified(true);

      // Fetch Categories
      const catRes = await fetchWooCommerceCategoriesList(url, consumerKey, consumerSecret);
      if (catRes.success && catRes.categories) {
        setAvailableCategories(catRes.categories);
      }

      // Fetch First page of Products
      const prodRes = await fetchWooCommerceProductsList(url, consumerKey, consumerSecret, '', 1);
      if (prodRes.success && prodRes.products) {
        setAvailableProducts(prodRes.products);
        setTotalRemoteProducts(prodRes.total || 0);
        setTotalRemotePages(prodRes.totalPages || 0);
        setProductPage(1);
      }
    } catch (e: any) {
      setResultMessage({ type: 'error', text: e.message || 'Erreur lors de la connexion' });
    } finally {
      setFetchingRemote(false);
    }
  };

  // Search or paginate individual products
  const handleSearchProducts = async (page: number = 1) => {
    if (!credentialsVerified) return;
    setFetchingRemote(true);
    try {
      const prodRes = await fetchWooCommerceProductsList(url, consumerKey, consumerSecret, productSearch, page);
      if (prodRes.success && prodRes.products) {
        setAvailableProducts(prodRes.products);
        setTotalRemoteProducts(prodRes.total || 0);
        setTotalRemotePages(prodRes.totalPages || 0);
        setProductPage(page);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setFetchingRemote(false);
    }
  };

  // Toggle Category selection
  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  // Toggle Product selection
  const toggleProduct = (prodId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSelectAllVisibleProducts = () => {
    const unimportedIds = availableProducts.filter(p => !p.alreadyImported).map(p => p.id);
    const allSelected = unimportedIds.every(id => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !unimportedIds.includes(id)));
    } else {
      setSelectedProductIds(prev => Array.from(new Set([...prev, ...unimportedIds])));
    }
  };

  // Launch Import
  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultMessage(null);
    setImportedProducts(0);
    setTotalProducts(0);
    setImportLogs([]);
    setLiveSuccessCount(0);
    setLiveAlreadyExistsCount(0);
    setLiveFailedCount(0);
    setLiveTabFilter('ALL');

    let accumulatedLogs: WcProductImportItemResult[] = [];
    let currentSuccess = 0;
    let currentAlreadyExists = 0;
    let currentFailed = 0;

    // Fast SEO Synchronizer Mode
    if (importMode === 'SEO_SYNC') {
      try {
        const seoRes = await syncWooCommerceRankMathSEO(url, consumerKey, consumerSecret);
        setLoading(false);
        if (seoRes.success) {
          setResultMessage({ type: 'success', text: seoRes.message });
          router.refresh();
        } else {
          setResultMessage({ type: 'error', text: seoRes.message });
        }
      } catch (err: any) {
        setResultMessage({ type: 'error', text: err.message || 'Erro durante a sincronização SEO.' });
        setLoading(false);
      }
      return;
    }

    try {
      // Étape 1 : Catégories
      setCurrentStep('CATEGORIES');
      setCurrentStepText('Étape 1/7 : Synchronisation des catégories et de leur hiérarchie...');
      setImportingCategories(true);
      const catIdsToSync = importMode === 'CATEGORIES' ? selectedCategoryIds : undefined;
      const catRes = await importWooCommerceCategories(url, consumerKey, consumerSecret, catIdsToSync);
      setImportingCategories(false);

      if (!catRes.success) {
        setResultMessage({ type: 'error', text: t('import_error') + ': ' + catRes.message });
        setLoading(false);
        return;
      }

      // Étape 2 : Livraison
      if (includeShipping) {
        setCurrentStep('SHIPPING');
        setCurrentStepText('Étape 2/7 : Importation des zones & modes de livraison...');
        try {
          const shipRes = await importWooCommerceShipping(url, consumerKey, consumerSecret);
          if (shipRes.success) {
            setShippingSummary({ zones: shipRes.zonesCount || 0, methods: shipRes.methodsCount || 0 });
          }
        } catch (shipErr) {
          console.error('Erreur import livraison:', shipErr);
        }
      }

      // Étape 3 : Commandes
      if (includeOrders) {
        setCurrentStep('ORDERS');
        setCurrentStepText('Étape 3/7 : Importation des commandes historiques & comptes clients...');
        try {
          const ordRes = await importWooCommerceOrders(url, consumerKey, consumerSecret);
          if (ordRes.success) {
            setOrdersImportedCount(ordRes.count || 0);
          }
        } catch (ordErr) {
          console.error('Erreur import commandes:', ordErr);
        }
      }

      // Étape 4 : Pages
      if (includePages) {
        setCurrentStep('PAGES');
        setCurrentStepText('Étape 4/7 : Importation des pages institutionnelles & mentions légales...');
        try {
          const pgsRes = await importWordPressPages(url, consumerKey, consumerSecret);
          if (pgsRes.success) {
            setPagesImportedCount(pgsRes.count || 0);
          }
        } catch (pgsErr) {
          console.error('Erreur import pages:', pgsErr);
        }
      }

      // Étape 5 : Articles de blog
      if (includeArticles) {
        setCurrentStep('ARTICLES');
        setCurrentStepText('Étape 5/7 : Importation des articles de blog & médias...');
        try {
          const artRes = await importWordPressArticles(url, consumerKey, consumerSecret);
          if (artRes.success) {
            setArticlesImportedCount(artRes.count || 0);
          }
        } catch (artErr) {
          console.error('Erreur import articles:', artErr);
        }
      }

      // Étape 6 : Produits, Variantes, Médias Cloudinary & SEO
      setCurrentStep('PRODUCTS');
      setCurrentStepText('Étape 6/7 : Importation des produits, médias Cloudinary & SEO...');

      // Case A: Import Individual Products
      if (importMode === 'INDIVIDUAL') {
        if (selectedProductIds.length === 0) {
          setResultMessage({ type: 'error', text: 'Veuillez sélectionner au moins un produit à importer.' });
          setLoading(false);
          return;
        }

        setTotalProducts(selectedProductIds.length);
        const importRes = await importWooCommerceSelectedProducts(url, consumerKey, consumerSecret, selectedProductIds);

        if (!importRes.success) {
          setResultMessage({ type: 'error', text: t('import_error') + ': ' + importRes.message });
          setLoading(false);
          return;
        }

        const newItems = importRes.results || [];
        accumulatedLogs = newItems;
        currentSuccess = importRes.successCount || 0;
        currentAlreadyExists = importRes.alreadyExistsCount || 0;
        currentFailed = importRes.failedCount || 0;

        setImportLogs(newItems);
        setLiveSuccessCount(currentSuccess);
        setLiveAlreadyExistsCount(currentAlreadyExists);
        setLiveFailedCount(currentFailed);
        setImportedProducts(newItems.length);

        // Étape 7 : Avis clients & Évaluations
        if (includeReviews) {
          setCurrentStep('REVIEWS');
          setCurrentStepText('Étape 7/7 : Importation des avis clients & notes d\'évaluation...');
          try {
            const revRes = await importWooCommerceReviews(url, consumerKey, consumerSecret);
            if (revRes.success) {
              setReviewsImportedCount(revRes.count || 0);
            }
          } catch (revErr) {
            console.error('Erreur import avis:', revErr);
          }
        }

        setCurrentStep('DONE');
        setCurrentStepText('Importation terminée avec succès !');

        // Open summary completion modal
        setSummaryStats({
          success: currentSuccess,
          alreadyExists: currentAlreadyExists,
          failed: currentFailed,
          total: newItems.length
        });
        setSummaryTabFilter(currentFailed > 0 ? 'FAILED' : 'ALL');
        setShowSummaryModal(true);
        setSelectedProductIds([]);
        await handleSearchProducts(productPage);
        return;
      }

      // Case B: Import By Category or ALL
      const catFilter = importMode === 'CATEGORIES' ? selectedCategoryIds : undefined;
      if (importMode === 'CATEGORIES' && selectedCategoryIds.length === 0) {
        setResultMessage({ type: 'error', text: 'Veuillez sélectionner au moins une catégorie.' });
        setLoading(false);
        return;
      }

      const countRes = await countWooCommerceProducts(url, consumerKey, consumerSecret, catFilter);
      if (!countRes.success || countRes.total === undefined) {
        setResultMessage({ type: 'error', text: t('import_error') + ': ' + countRes.message });
        setLoading(false);
        return;
      }

      const total = countRes.total;
      setTotalProducts(total);

      if (total === 0) {
        setSummaryStats({ success: 0, alreadyExists: 0, failed: 0, total: 0 });
        setSummaryTabFilter('ALL');
        setShowSummaryModal(true);
        setLoading(false);
        return;
      }

      // Import batch by batch
      const perPage = 2; // 2 par 2 pour progression fluide et réactive sans timeout
      const totalPages = Math.ceil(total / perPage);

      for (let page = 1; page <= totalPages; page++) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user-activity'));
        }

        try {
          const batchRes = await importWooCommerceProductsBatch(url, consumerKey, consumerSecret, page, perPage, catFilter);
          if (batchRes.success && batchRes.results) {
            accumulatedLogs = [...accumulatedLogs, ...batchRes.results];
            currentSuccess += (batchRes.successCount || 0);
            currentAlreadyExists += (batchRes.alreadyExistsCount || 0);
            currentFailed += (batchRes.failedCount || 0);

            setImportLogs([...accumulatedLogs]);
            setLiveSuccessCount(currentSuccess);
            setLiveAlreadyExistsCount(currentAlreadyExists);
            setLiveFailedCount(currentFailed);
            setImportedProducts(accumulatedLogs.length);
          } else if (!batchRes.success) {
            currentFailed++;
            const failedBatchItem: WcProductImportItemResult = {
              id: page,
              name: `Lot #${page}`,
              status: 'FAILED',
              error: batchRes.message || 'Erreur lors du traitement du lot'
            };
            accumulatedLogs = [...accumulatedLogs, failedBatchItem];
            setImportLogs([...accumulatedLogs]);
            setLiveFailedCount(currentFailed);
            setImportedProducts(accumulatedLogs.length);
          }
        } catch (batchErr: any) {
          currentFailed++;
          const failedBatchItem: WcProductImportItemResult = {
            id: page,
            name: `Lot #${page}`,
            status: 'FAILED',
            error: batchErr?.message || 'Erreur réseau ou délai dépassé'
          };
          accumulatedLogs = [...accumulatedLogs, failedBatchItem];
          setImportLogs([...accumulatedLogs]);
          setLiveFailedCount(currentFailed);
          setImportedProducts(accumulatedLogs.length);
        }
      }

      // Étape 7 : Avis clients & Évaluations
      if (includeReviews) {
        setCurrentStep('REVIEWS');
        setCurrentStepText('Étape 7/7 : Importation des avis clients & notes d\'évaluation...');
        try {
          const revRes = await importWooCommerceReviews(url, consumerKey, consumerSecret);
          if (revRes.success) {
            setReviewsImportedCount(revRes.count || 0);
          }
        } catch (revErr) {
          console.error('Erreur import avis:', revErr);
        }
      }

      setCurrentStep('DONE');
      setCurrentStepText('Importation terminée avec succès !');

      // Import loop complete! Open summary notification modal
      setSummaryStats({
        success: currentSuccess,
        alreadyExists: currentAlreadyExists,
        failed: currentFailed,
        total: accumulatedLogs.length
      });
      setSummaryTabFilter(currentFailed > 0 ? 'FAILED' : 'ALL');
      setShowSummaryModal(true);

    } catch (error: any) {
      setResultMessage({ type: 'error', text: t('import_error') + ': ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // Filtered live logs (during import)
  const filteredLiveLogs = useMemo(() => {
    if (liveTabFilter === 'ALL') return importLogs;
    return importLogs.filter(item => item.status === liveTabFilter);
  }, [importLogs, liveTabFilter]);

  // Filtered summary logs (in final modal)
  const filteredSummaryLogs = useMemo(() => {
    return importLogs.filter(item => {
      const matchesTab = summaryTabFilter === 'ALL' || item.status === summaryTabFilter;
      const matchesSearch = !summarySearch.trim() ||
        item.name.toLowerCase().includes(summarySearch.toLowerCase()) ||
        (item.error && item.error.toLowerCase().includes(summarySearch.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [importLogs, summaryTabFilter, summarySearch]);

  // Copy failed items to clipboard
  const handleCopyErrors = () => {
    const failedItems = importLogs.filter(i => i.status === 'FAILED');
    const text = failedItems.map(i => `• [ID ${i.id}] ${i.name} : ${i.error || 'Erreur inconnue'}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedErrors(true);
    setTimeout(() => setCopiedErrors(false), 2500);
  };

  const handleCloseSummary = () => {
    setShowSummaryModal(false);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => { resetModal(); setIsOpen(true); }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition flex items-center space-x-2 shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        <span>{t('import_woo_btn')}</span>
      </button>

      {/* Main Configuration Modal */}
      {isOpen && !showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('import_woo_title')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Importez des catégories entières, tous vos articles ou des produits au choix.</p>
              </div>
              <button
                onClick={() => !loading && setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Source Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setSourceTab('API')}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${sourceTab === 'API' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span>🌐</span>
                <span>Connexion API REST</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceTab('CSV')}
                className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${sourceTab === 'CSV' ? 'bg-white text-blue-700 shadow-xs font-bold ring-1 ring-blue-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span>📁</span>
                <span>Fichier d'export (JSON / CSV)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                  100% Complet
                </span>
              </button>
            </div>

            {sourceTab === 'API' ? (
              <form onSubmit={handleStartImport} className="flex-1 overflow-y-auto pr-1 space-y-4">

                {/* Credentials Section */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Identifiants WooCommerce</span>
                    {credentialsVerified && (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        ✓ Connecté
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <input
                        type="url"
                        required
                        placeholder="https://votreboutique.com"
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setCredentialsVerified(false); }}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={loading}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <input
                        type="text"
                        required
                        placeholder="Client Key (ck_...)"
                        value={consumerKey}
                        onChange={(e) => { setConsumerKey(e.target.value); setCredentialsVerified(false); }}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={loading}
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <input
                        type="password"
                        required
                        placeholder="Client Secret (cs_...)"
                        value={consumerSecret}
                        onChange={(e) => { setConsumerSecret(e.target.value); setCredentialsVerified(false); }}
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={handleConnectAndFetch}
                        disabled={fetchingRemote || loading || !url || !consumerKey || !consumerSecret}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold shrink-0 disabled:opacity-50 transition"
                      >
                        {fetchingRemote ? 'Connexion...' : 'Charger'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Import Mode Selector */}
                {credentialsVerified && !loading && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Méthode d'importation</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('ALL')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col ${importMode === 'ALL' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="font-bold text-xs text-gray-900">Tout importer</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Tous les produits du catalogue</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('CATEGORIES')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col ${importMode === 'CATEGORIES' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="font-bold text-xs text-gray-900">Par catégorie</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Sélectionner des catégories</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('INDIVIDUAL')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col ${importMode === 'INDIVIDUAL' ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="font-bold text-xs text-gray-900">Produits au choix</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Sélectionner individuellement</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('SEO_SYNC')}
                        className={`p-3 rounded-xl border text-left transition flex flex-col ${importMode === 'SEO_SYNC' ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="font-bold text-xs text-emerald-900 flex items-center gap-1">
                          <span>🎯</span> Synchroniser SEO
                        </span>
                        <span className="text-[10px] text-emerald-700 mt-0.5 font-medium">RankMath & Yoast (Rapide)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Data Options (Shipping, Orders, Pages, Articles, Reviews) */}
                {credentialsVerified && !loading && importMode !== 'SEO_SYNC' && (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Données complémentaires à importer
                      </span>
                      <span className="text-[10px] text-stone-500">Récupération intégrale de votre boutique WooCommerce</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. Shipping Zones & Methods */}
                      <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition select-none ${includeShipping ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
                        <input
                          type="checkbox"
                          checked={includeShipping}
                          onChange={(e) => setIncludeShipping(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                            🚚 Zones & Frais de Livraison
                          </span>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Zones desservies, frais d'expédition et options de transport
                          </span>
                        </div>
                      </label>

                      {/* 2. Orders */}
                      <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition select-none ${includeOrders ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
                        <input
                          type="checkbox"
                          checked={includeOrders}
                          onChange={(e) => setIncludeOrders(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                            📦 Commandes & Historique Clients
                          </span>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Historique des commandes, coordonnées et adresses de livraison
                          </span>
                        </div>
                      </label>

                      {/* 3. Pages */}
                      <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition select-none ${includePages ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
                        <input
                          type="checkbox"
                          checked={includePages}
                          onChange={(e) => setIncludePages(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                            📄 Pages Institutionnelles
                          </span>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Mentions légales, politique de confidentialité, retours et contact
                          </span>
                        </div>
                      </label>

                      {/* 4. Blog Articles */}
                      <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition select-none ${includeArticles ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
                        <input
                          type="checkbox"
                          checked={includeArticles}
                          onChange={(e) => setIncludeArticles(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                            📝 Articles de Blog & Actualités
                          </span>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Guides d'achat, conseils d'entretien électroménager et articles
                          </span>
                        </div>
                      </label>

                      {/* 5. Reviews */}
                      <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition select-none sm:col-span-2 ${includeReviews ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/20' : 'bg-white border-stone-200 hover:bg-stone-50'}`}>
                        <input
                          type="checkbox"
                          checked={includeReviews}
                          onChange={(e) => setIncludeReviews(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 mt-0.5"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                            ⭐ Avis Clients & Évaluations Étoilées
                          </span>
                          <span className="text-[11px] text-stone-500 block mt-0.5">
                            Notes de 1 à 5 étoiles, avis vérifiés et commentaires clients associés aux produits
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Informational Banner */}
                    <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center gap-2 text-[11px] text-blue-800">
                      <span className="text-sm">✨</span>
                      <span>
                        <strong>Inclus automatiquement :</strong> Téléchargement et optimisation des visuels sur <strong>Cloudinary</strong>, et extraction des métadonnées SEO (<strong>RankMath & Yoast</strong>).
                      </span>
                    </div>
                  </div>
                )}

                {/* Mode A: Categories List */}
                {credentialsVerified && importMode === 'CATEGORIES' && !loading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Catégories disponibles ({availableCategories.length}) :</span>
                      <span className="text-gray-500 font-medium">{selectedCategoryIds.length} sélectionnée(s)</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                      {availableCategories.length === 0 ? (
                        <p className="p-4 text-xs text-gray-400 text-center">Aucune catégorie trouvée.</p>
                      ) : (
                        availableCategories.map(cat => (
                          <label key={cat.id} className="flex items-center justify-between px-3.5 py-2 hover:bg-gray-50 cursor-pointer text-xs">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={selectedCategoryIds.includes(cat.id)}
                                onChange={() => toggleCategory(cat.id)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <span className="font-medium text-gray-800">{cat.name}</span>
                            </div>
                            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                              {cat.count} prod.
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Mode B: Individual Products List */}
                {credentialsVerified && importMode === 'INDIVIDUAL' && !loading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Rechercher un produit distant..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchProducts(1))}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchProducts(1)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition"
                      >
                        Rechercher
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectAllVisibleProducts}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold rounded-lg transition"
                      >
                        Tout cocher page
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{selectedProductIds.length} produit(s) sélectionné(s) pour import</span>
                      <span>Total distant : {totalRemoteProducts}</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                      {availableProducts.length === 0 ? (
                        <p className="p-4 text-xs text-gray-400 text-center">Aucun produit trouvé.</p>
                      ) : (
                        availableProducts.map(prod => (
                          <div key={prod.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(prod.id)}
                                onChange={() => toggleProduct(prod.id)}
                                disabled={prod.alreadyImported}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-40"
                              />
                              {prod.image ? (
                                <Image
                                  src={prod.image}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="w-9 h-9 object-cover rounded-md border shrink-0 bg-gray-50"
                                />
                              ) : (
                                <div className="w-9 h-9 bg-gray-100 rounded-md shrink-0 flex items-center justify-center text-[10px] text-gray-400">
                                  No img
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {prod.alreadyImported && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 mr-1.5">
                                      Already exist
                                    </span>
                                  )}
                                  {prod.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {prod.categories.join(', ') || 'Sans catégorie'} &bull; <span className="font-bold text-gray-700">{prod.price}€</span>
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {prod.alreadyImported ? (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>Already exist</span>
                                </span>
                              ) : selectedProductIds.includes(prod.id) ? (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                  Sélectionné
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pagination */}
                    {totalRemotePages > 1 && (
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          disabled={productPage <= 1 || fetchingRemote}
                          onClick={() => handleSearchProducts(productPage - 1)}
                          className="px-2.5 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
                        >
                          Précédent
                        </button>
                        <span className="text-gray-500 text-[11px]">Page {productPage} sur {totalRemotePages}</span>
                        <button
                          type="button"
                          disabled={productPage >= totalRemotePages || fetchingRemote}
                          onClick={() => handleSearchProducts(productPage + 1)}
                          className="px-2.5 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* LIVE IMPORT PROGRESS STREAM */}
                {loading && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">

                    {/* Step-by-Step Tracker */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span>Progression de l'import par étapes :</span>
                        <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {currentStep === 'DONE' ? 'Terminé' : (currentStepText ? currentStepText.split(':')[0] : 'En cours')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        {[
                          { key: 'CATEGORIES', label: '1. Catégories', icon: '📁', active: true },
                          { key: 'SHIPPING', label: '2. Livraison', icon: '🚚', active: includeShipping },
                          { key: 'ORDERS', label: '3. Commandes', icon: '📦', active: includeOrders },
                          { key: 'PAGES', label: '4. Pages', icon: '📄', active: includePages },
                          { key: 'ARTICLES', label: '5. Blog', icon: '📝', active: includeArticles },
                          { key: 'PRODUCTS', label: '6. Produits & SEO', icon: '🛍️', active: true },
                          { key: 'REVIEWS', label: '7. Avis clients', icon: '⭐', active: includeReviews },
                        ].filter(s => s.active).map((st, i, arr) => {
                          const enabledKeys = arr.map(s => s.key);
                          const curIdx = currentStep === 'DONE' ? enabledKeys.length : enabledKeys.indexOf(currentStep);
                          const isDone = curIdx !== -1 && i < curIdx;
                          const isCurrent = curIdx !== -1 && i === curIdx;

                          return (
                            <div
                              key={st.key}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isCurrent
                                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs animate-pulse ring-2 ring-blue-400/30'
                                  : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}
                            >
                              <span>{isDone ? '✓' : st.icon}</span>
                              <span>{st.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                        <span>{currentStepText || 'Traitement en cours...'}</span>
                      </div>
                    </div>

                    {/* Products Progress Bar & Counters */}
                    {(currentStep === 'PRODUCTS' || importLogs.length > 0 || totalProducts > 0) && (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-900 flex items-center gap-2">
                              <span>📦 Traitement des produits :</span>
                            </span>
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {importedProducts} / {totalProducts} {totalProducts > 0 ? `(${Math.min(100, Math.round((importedProducts / totalProducts) * 100))}%)` : ''}
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${totalProducts > 0 ? Math.min(100, Math.round((importedProducts / totalProducts) * 100)) : 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Live Counters */}
                        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-1.5 px-2">
                            <span className="block text-[11px] font-bold text-emerald-700">✓ {liveSuccessCount} Réussite{liveSuccessCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg py-1.5 px-2">
                            <span className="block text-[11px] font-bold text-amber-700">⚠️ {liveAlreadyExistsCount} Already exist</span>
                          </div>
                          <div className="bg-rose-50 border border-rose-200 rounded-lg py-1.5 px-2">
                            <span className="block text-[11px] font-bold text-rose-700">✕ {liveFailedCount} Échec{liveFailedCount > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Live Log Filter Tabs */}
                    {importLogs.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between border-b pb-1 text-[11px]">
                          <span className="font-semibold text-gray-700">Journal en direct ({importLogs.length}) :</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setLiveTabFilter('ALL')}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${liveTabFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                              Tous
                            </button>
                            <button
                              type="button"
                              onClick={() => setLiveTabFilter('FAILED')}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${liveTabFilter === 'FAILED' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}
                            >
                              Échecs ({liveFailedCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setLiveTabFilter('ALREADY_EXISTS')}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${liveTabFilter === 'ALREADY_EXISTS' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                            >
                              Already exist ({liveAlreadyExistsCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setLiveTabFilter('SUCCESS')}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${liveTabFilter === 'SUCCESS' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'}`}
                            >
                              Réussis ({liveSuccessCount})
                            </button>
                          </div>
                        </div>

                        {/* Live Items Scroll Box */}
                        <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-1.5 space-y-1.5 bg-white">
                          {filteredLiveLogs.length === 0 ? (
                            <p className="p-3 text-[11px] text-gray-400 text-center">Aucun produit dans ce filtre pour le moment.</p>
                          ) : (
                            filteredLiveLogs.map((item, idx) => (
                              <div key={idx} className="flex items-start justify-between p-2 rounded-md bg-gray-50/80 border border-gray-100 gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                  {item.image ? (
                                    <img src={item.image} alt="" className="w-8 h-8 rounded object-cover border shrink-0 bg-white" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs shrink-0">
                                      📦
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {item.status === 'ALREADY_EXISTS' && (
                                        <span className="font-extrabold text-[10px] uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded shrink-0">
                                          Already exist
                                        </span>
                                      )}
                                      {item.status === 'SUCCESS' && (
                                        <span className="font-bold text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded shrink-0">
                                          ✓ Importé
                                        </span>
                                      )}
                                      {item.status === 'FAILED' && (
                                        <span className="font-bold text-[10px] uppercase tracking-wide bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 rounded shrink-0">
                                          ✕ Échec
                                        </span>
                                      )}
                                      <span className="text-xs font-semibold text-gray-900 truncate">
                                        {item.status === 'ALREADY_EXISTS' ? `[Already exist] ${item.name}` : item.name}
                                      </span>
                                    </div>
                                    {item.status === 'FAILED' && item.error && (
                                      <p className="text-[10px] text-rose-600 mt-0.5 bg-rose-50 p-1 rounded border border-rose-200 font-mono">
                                        {item.error}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 shrink-0">
                                  {item.price ? `${item.price} €` : ''}
                                </span>
                              </div>
                            ))
                          )}
                          <div ref={liveLogsEndRef} />
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Result Message */}
                {resultMessage && (
                  <div className={`p-3.5 rounded-xl text-xs font-medium space-y-2.5 ${resultMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    <div>{resultMessage.text}</div>
                    {(resultMessage.text.includes('SiteGround') || resultMessage.text.includes('SG-Captcha') || resultMessage.text.includes('202')) && (
                      <div className="pt-2.5 border-t border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-red-100/60 -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl">
                        <div className="text-[11px] text-red-900 leading-tight">
                          <strong>Solution immédiate sans blocage pare-feu :</strong> Importez l'intégralité du site (Avis, Commandes, Pages, Blog, SEO, Produits) via le fichier d'export en 1 clic.
                        </div>
                        <button
                          type="button"
                          onClick={() => { setSourceTab('CSV'); setResultMessage(null); }}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shrink-0 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🚀</span>
                          <span>Passer à l'import complet (JSON) ➔</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-gray-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="w-1/3 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !credentialsVerified}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Traitement en cours...</span>
                      </>
                    ) : (
                      <span>
                        {importMode === 'INDIVIDUAL'
                          ? `Importer les ${selectedProductIds.length} produit(s) sélectionné(s)`
                          : importMode === 'CATEGORIES'
                            ? `Importer les catégories sélectionnées`
                            : importMode === 'SEO_SYNC'
                              ? `Synchroniser le SEO RankMath & Yoast`
                              : `Importer tout le catalogue`}
                      </span>
                    )}
                  </button>
                </div>

              </form>
            ) : (
              /* File Import View (JSON Full Backup & CSV) */
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {/* Method 1: Full JSON Backup (Recommended) */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
                      <span className="text-lg">⚡</span>
                      <span>Importation Intégrale (Recommandée — 100% Autonome)</span>
                    </div>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Avis + Commandes + Pages + Blog + SEO + Produits
                    </span>
                  </div>

                  <p className="text-blue-900 text-[11px] leading-relaxed">
                    SiteGround bloque les serveurs externes avec son pare-feu Nginx (SG-Captcha), mais <strong>autorise immédiatement votre navigateur</strong>. En exécutant ce script d'export en 1 clic depuis votre navigateur, vous téléchargez la totalité de vos données sans aucun blocage :
                  </p>

                  <div className="space-y-2 bg-white/90 p-3.5 rounded-xl border border-blue-100 text-[11px] text-gray-800 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                      <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
                        <span>Téléchargez le script d'export officiel FRANK HAUSGERÄTE :</span>
                        <a
                          href="/export-frankh.php"
                          download="export-frankh.php"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shadow-xs transition"
                        >
                          <span>⬇️</span>
                          <span>Télécharger export-frankh.php</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                      <div className="flex-1">
                        Déposez ce fichier dans le dossier <code>public_html/</code> de votre WordPress via <strong>SiteGround Site Tools &gt; Site &gt; Gestionnaire de fichiers</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                      <div className="flex-1">
                        Ouvrez cette adresse dans votre navigateur :{' '}
                        <a
                          href="https://frankhausgeraete.de/export-frankh.php?token=frankh2026"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold underline hover:text-blue-800"
                        >
                          https://frankhausgeraete.de/export-frankh.php?token=frankh2026
                        </a>
                        <span className="text-gray-500 block text-[10px] mt-0.5">Le fichier <code>frankhausgeraete-export.json</code> se télécharge en 3 secondes.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">4</span>
                      <div className="flex-1">
                        Déposez le fichier <code>.json</code> téléchargé dans la zone ci-dessous et cliquez sur <strong>Importer</strong> !
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dropzone */}
                <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 text-center transition bg-gray-50/50">
                  <input
                    type="file"
                    id="woo-csv-file"
                    accept=".json,application/json,.csv,text/csv"
                    onChange={handleCsvFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <label htmlFor="woo-csv-file" className="cursor-pointer block space-y-2.5">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
                      {fileMeta?.isJson ? '📦' : '📄'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {csvFileName ? `Fichier prêt : ${csvFileName}` : 'Glissez votre fichier .json (ou .csv) ici ou cliquez pour parcourir'}
                      </p>

                      {fileMeta?.isJson ? (
                        <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px]">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">📦 {fileMeta.productsCount} Produits</span>
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">⭐ {fileMeta.reviewsCount || 0} Avis</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-semibold">🛒 {fileMeta.ordersCount || 0} Commandes</span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-semibold">📄 {fileMeta.pagesCount || 0} Pages</span>
                          <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md font-semibold">✍️ {fileMeta.articlesCount || 0} Articles Blog</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {csvProductsCount !== null
                            ? `${csvProductsCount} produit(s) détecté(s)`
                            : 'Prend en charge le JSON de sauvegarde intégrale et le CSV WooCommerce'}
                        </p>
                      )}
                    </div>
                    <span className="inline-block px-3.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50">
                      Parcourir les fichiers
                    </span>
                  </label>
                </div>

                {/* Optional CSV details toggle */}
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setShowCsvOption(!showCsvOption)}
                    className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold flex items-center justify-between text-left transition"
                  >
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span>📁</span>
                      <span>Vous préférez importer uniquement le fichier CSV standard WooCommerce ?</span>
                    </span>
                    <span className="text-gray-400 text-xs">{showCsvOption ? '▲' : '▼'}</span>
                  </button>
                  {showCsvOption && (
                    <div className="p-3 bg-white border-t border-gray-100 text-[11px] text-gray-600 space-y-1.5 leading-relaxed">
                      <p>
                        Dans votre WordPress, allez dans <strong>Produits &gt; Tous les produits &gt; Exporter</strong>, cochez <em>« Exporter toutes les métadonnées »</em> et déposez le <code>.csv</code> ci-dessus.
                      </p>
                      <p className="text-gray-500 italic">
                        (Note : Le CSV n'exporte que les produits et catégories. Pour les avis, commandes, pages et blog, utilisez la méthode 1 ci-dessus).
                      </p>
                    </div>
                  )}
                </div>

                {/* Live Progress when file loading */}
                {loading && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                      <span>Progression de l'import :</span>
                      <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {currentStep === 'DONE' ? 'Terminé' : (currentStepText ? currentStepText.split(':')[0] : 'En cours')}
                      </span>
                    </div>

                    {/* Step-by-Step Badges */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {[
                        { key: 'SHIPPING', label: '1. Livraison', icon: '🚚' },
                        { key: 'PAGES', label: `2. Pages (${pagesImportedCount})`, icon: '📄' },
                        { key: 'ARTICLES', label: `3. Blog (${articlesImportedCount})`, icon: '📝' },
                        { key: 'PRODUCTS', label: `4. Produits (${importedProducts}/${totalProducts || '...'})`, icon: '🛍️' },
                        { key: 'REVIEWS', label: `5. Avis (${reviewsImportedCount})`, icon: '⭐' },
                        { key: 'ORDERS', label: `6. Commandes (${ordersImportedCount})`, icon: '📦' },
                      ].map((st, i, arr) => {
                        const stepOrder = ['SHIPPING', 'PAGES', 'ARTICLES', 'PRODUCTS', 'REVIEWS', 'ORDERS'];
                        const curIdx = currentStep === 'DONE' ? stepOrder.length : stepOrder.indexOf(currentStep);
                        const isDone = curIdx !== -1 && i < curIdx;
                        const isCurrent = curIdx !== -1 && i === curIdx;

                        return (
                          <div
                            key={st.key}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${isDone
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isCurrent
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs animate-pulse ring-2 ring-blue-400/30'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                              }`}
                          >
                            <span>{isDone ? '✓' : st.icon}</span>
                            <span>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Progress Bar for Products */}
                    {totalProducts > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                          <span>Produits importés</span>
                          <span className="font-mono text-blue-600">{importedProducts} / {totalProducts} ({Math.min(100, Math.round((importedProducts / totalProducts) * 100))}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round((importedProducts / totalProducts) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                      <span>{currentStepText || 'Importation en cours...'}</span>
                    </div>

                    {(liveSuccessCount > 0 || liveAlreadyExistsCount > 0 || liveFailedCount > 0) && (
                      <div className="flex gap-2 text-[11px] font-semibold">
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">✓ {liveSuccessCount} importés</span>
                        {liveAlreadyExistsCount > 0 && <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">ℹ️ {liveAlreadyExistsCount} déjà existants</span>}
                        {liveFailedCount > 0 && <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">⚠️ {liveFailedCount} échecs</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Result Message */}
                {resultMessage && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${resultMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {resultMessage.text}
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2 border-t border-gray-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="w-1/3 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleStartCsvImport}
                    disabled={loading || !csvFile}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Traitement en cours...</span>
                      </>
                    ) : (
                      <span>
                        {fileMeta?.isJson
                          ? `Importer tout le site (${fileMeta.productsCount} produits, avis, commandes, pages, blog)`
                          : csvProductsCount
                            ? `Importer les ${csvProductsCount} produits du CSV`
                            : 'Lancer l\'importation'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINAL NOTIFICATION & SUMMARY MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${summaryStats.failed > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {summaryStats.failed > 0 ? '⚠️' : '🎉'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Importation WooCommerce terminée</h2>
                  <p className="text-xs text-gray-500">Compte rendu complet du traitement de vos produits et contenus.</p>
                </div>
              </div>
              <button
                onClick={handleCloseSummary}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Réussite */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
                  <span className="text-2xl font-black text-emerald-600 block">{summaryStats.success}</span>
                  <span className="text-xs font-bold text-emerald-800 mt-0.5 block">Réussite{summaryStats.success > 1 ? 's' : ''}</span>
                  <span className="text-[10px] text-emerald-600">Produits ajoutés</span>
                </div>

                {/* Already exist */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-center">
                  <span className="text-2xl font-black text-amber-600 block">{summaryStats.alreadyExists}</span>
                  <span className="text-xs font-bold text-amber-800 mt-0.5 block">Already exist</span>
                  <span className="text-[10px] text-amber-600">Déjà présents sur le site</span>
                </div>

                {/* Échecs */}
                <div className={`rounded-xl p-3.5 text-center border ${summaryStats.failed > 0 ? 'bg-rose-50 border-rose-300' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`text-2xl font-black block ${summaryStats.failed > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                    {summaryStats.failed}
                  </span>
                  <span className={`text-xs font-bold mt-0.5 block ${summaryStats.failed > 0 ? 'text-rose-800' : 'text-gray-600'}`}>
                    Échec{summaryStats.failed > 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-gray-500">Erreurs d'import</span>
                </div>
              </div>

              {/* Alert Callout if failures */}
              {summaryStats.failed > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold">Des erreurs ont été rencontrées sur {summaryStats.failed} produit(s).</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">Consultez l'onglet « Échecs » ci-dessous pour voir la liste détaillée et le motif exact de chaque échec.</p>
                  </div>
                </div>
              )}

              {/* Extra Imported Data Badges */}
              {(shippingSummary || ordersImportedCount !== null || pagesImportedCount !== null || articlesImportedCount !== null || reviewsImportedCount !== null || summaryStats.success > 0 || summaryStats.alreadyExists > 0) && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <span className="font-bold text-stone-900 block">Récapitulatif des contenus & optimisations :</span>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {reviewsImportedCount !== null && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold rounded-lg border border-amber-200 flex items-center gap-1.5 shadow-xs">
                        ⭐ {reviewsImportedCount} Avis clients & notes d'évaluation
                      </span>
                    )}
                    {shippingSummary && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                        🚚 {shippingSummary.zones} Zones de livraison ({shippingSummary.methods} méthodes de transport)
                      </span>
                    )}
                    {ordersImportedCount !== null && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-semibold rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-xs">
                        📦 {ordersImportedCount} Commandes clients historiques
                      </span>
                    )}
                    {pagesImportedCount !== null && (
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-800 font-semibold rounded-lg border border-purple-200 flex items-center gap-1.5 shadow-xs">
                        📄 {pagesImportedCount} Pages institutionnelles
                      </span>
                    )}
                    {articlesImportedCount !== null && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold rounded-lg border border-amber-200 flex items-center gap-1.5 shadow-xs">
                        📝 {articlesImportedCount} Articles de blog & guides
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                      🎯 Méta-données SEO RankMath & Yoast synchronisées
                    </span>
                    <span className="px-2.5 py-1 bg-sky-50 text-sky-800 font-semibold rounded-lg border border-sky-200 flex items-center gap-1.5 shadow-xs">
                      ☁️ Médias et visuels hébergés sur Cloudinary
                    </span>
                  </div>
                </div>
              )}

              {/* Tabs & Search Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">

                  {/* Filter Tabs */}
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSummaryTabFilter('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${summaryTabFilter === 'ALL' ? 'bg-gray-900 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Tous ({summaryStats.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryTabFilter('FAILED')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${summaryTabFilter === 'FAILED' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'}`}
                    >
                      <span>Échecs</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${summaryTabFilter === 'FAILED' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-800'}`}>
                        {summaryStats.failed}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryTabFilter('ALREADY_EXISTS')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${summaryTabFilter === 'ALREADY_EXISTS' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'}`}
                    >
                      <span>Already exist</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${summaryTabFilter === 'ALREADY_EXISTS' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-800'}`}>
                        {summaryStats.alreadyExists}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryTabFilter('SUCCESS')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${summaryTabFilter === 'SUCCESS' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'}`}
                    >
                      <span>Réussis</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${summaryTabFilter === 'SUCCESS' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
                        {summaryStats.success}
                      </span>
                    </button>
                  </div>

                  {/* Search within summary */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filtrer la liste..."
                      value={summarySearch}
                      onChange={(e) => setSummarySearch(e.target.value)}
                      className="pl-7 pr-3 py-1 text-xs border border-gray-300 rounded-lg w-full sm:w-44 focus:ring-1 focus:ring-blue-500"
                    />
                    <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>

                </div>

                {/* Items List */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white">
                  {filteredSummaryLogs.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs">
                      Aucun produit ne correspond au filtre sélectionné.
                    </div>
                  ) : (
                    filteredSummaryLogs.map((item, idx) => (
                      <div key={idx} className="p-3 hover:bg-gray-50 flex items-start justify-between gap-3 transition">
                        <div className="flex items-start gap-3 min-w-0">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover border shrink-0 bg-gray-50" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.status === 'ALREADY_EXISTS' && (
                                <span className="font-extrabold text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>Already exist</span>
                                </span>
                              )}
                              {item.status === 'SUCCESS' && (
                                <span className="font-bold text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <span>✓</span>
                                  <span>Importé</span>
                                </span>
                              )}
                              {item.status === 'FAILED' && (
                                <span className="font-bold text-[10px] uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <span>✕</span>
                                  <span>Échec</span>
                                </span>
                              )}
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {item.status === 'ALREADY_EXISTS' ? `[Already exist] ${item.name}` : item.name}
                              </p>
                            </div>

                            {item.status === 'FAILED' && item.error && (
                              <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono leading-relaxed">
                                <span className="font-bold">Motif de l'échec :</span> {item.error}
                              </div>
                            )}

                            <p className="text-[10px] text-gray-500 mt-1">
                              ID WooCommerce: <span className="font-mono">{item.id}</span>
                              {item.price ? ` • Prix: ${item.price} €` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              {summaryStats.failed > 0 ? (
                <button
                  type="button"
                  onClick={handleCopyErrors}
                  className="px-3.5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  <span>{copiedErrors ? '✓ Liste copiée !' : 'Copier les échecs'}</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleCloseSummary}
                className="bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Fermer et actualiser
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
