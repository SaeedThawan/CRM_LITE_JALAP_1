const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec'; // تأكد أن هذا الرابط هو الصحيح لتطبيق الويب الخاص بك

// تعريف المتغيرات لتخزين البيانات المحملة
let productsData = [];
let inventoryProductsData = []; // بيانات منتجات الجرد
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];

// الحصول على عناصر DOM الأساسية
const visitForm = document.getElementById('visitForm');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// عناصر DOM الخاصة بالأقسام الديناميكية
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');

// ---------------------------------------------------
// الدوال المساعدة للتحميل وتعبئة النموذج
// ---------------------------------------------------

/**
 * دالة عامة لتحميل ملفات JSON.
 * @param {string} url - مسار الملف.
 * @returns {Promise<any>} - وعد (Promise) بالبيانات.
 */
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    showErrorMessage('حدث خطأ أثناء تحميل البيانات الأولية. يرجى إعادة تحميل الصفحة.');
    return [];
  }
}

/**
 * دالة لتحميل جميع البيانات الأولية من ملفات JSON.
 */
async function loadAllData() {
  showLoading(true);
  try {
    const [
      products,
      salesReps,
      customers,
      outcomes,
      purposes,
      types
    ] = await Promise.all([
      fetchData('products.json'),
      fetchData('sales_representatives.json'),
      fetchData('customers_main.json'),
      fetchData('visit_outcomes.json'),
      fetchData('visit_purposes.json'),
      fetchData('visit_types.json')
    ]);

    productsData = products;
    // فلترة منتجات الجرد
    inventoryProductsData = products.filter(p => p.Category === 'المشروبات' || p.Category === '5فايف ستار');
    salesRepresentatives = salesReps;
    customersMain = customers;
    visitOutcomes = outcomes;
    visitPurposes = purposes;
    visitTypes = types;

    // تعبئة عناصر النموذج
    populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR');
    populateDatalist(customerListDatalist, customersMain, 'Customer_Name_AR');
    populateSelect(visitOutcomeSelect, visitOutcomes, 'Visit_Outcome_AR');
    populateSelect(visitPurposeSelect, visitPurposes, 'Visit_Purpose_AR');
    populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR');
    populateDatalist(inventoryListDatalist, inventoryProductsData, 'Product_Name_AR');

    // إنشاء أزرار الفئات للمنتجات
    createProductCategoryButtons(productsData);

  } catch (error) {
    console.error('Failed to load all initial data:', error);
  } finally {
    showLoading(false);
  }
}

/**
 * دالة لتعبئة عنصر <select> ببيانات من مصفوفة.
 * @param {HTMLElement} selectElement - عنصر الـ select.
 * @param {Array} dataArray - مصفوفة البيانات.
 * @param {string} key - المفتاح الذي سيتم استخدامه كقيمة ونص.
 */
function populateSelect(selectElement, dataArray, key) {
  selectElement.innerHTML = `<option value="">اختر ${selectElement.previousElementSibling.textContent.trim()}</option>`;
  dataArray.forEach(item => {
    const option = document.createElement('option');
    const value = key ? item[key] : item;
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

/**
 * دالة لتعبئة عنصر <datalist> ببيانات من مصفوفة.
 * @param {HTMLElement} datalistElement - عنصر الـ datalist.
 * @param {Array} dataArray - مصفوفة البيانات.
 * @param {string} key - المفتاح الذي سيتم استخدامه كقيمة ونص.
 */
function populateDatalist(datalistElement, dataArray, key) {
  datalistElement.innerHTML = '';
  dataArray.forEach(item => {
    const option = document.createElement('option');
    const value = key ? item[key] : item;
    option.value = value;
    datalistElement.appendChild(option);
  });
}

/**
 * دالة لتبديل عرض الأقسام بناءً على نوع الزيارة.
 * @param {string} visitType - نوع الزيارة (مثال: 'جرد استثنائي', 'زيارة عادية').
 */
function toggleVisitSections(visitType) {
  const normalFields = normalVisitRelatedFieldsDiv.querySelectorAll('select, input, textarea');
  const inventoryFields = inventoryItemsContainer.querySelectorAll('select, input');

  if (visitType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden');
    inventorySectionDiv.classList.remove('hidden');

    // إضافة سمات required لحقول الجرد
    inventoryFields.forEach(el => el.setAttribute('required', ''));
    // إزالة سمات required من حقول الزيارة العادية
    normalFields.forEach(el => el.removeAttribute('required'));
  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden');
    inventorySectionDiv.classList.add('hidden');

    // إضافة سمات required لحقول الزيارة العادية
    normalFields.forEach(el => el.setAttribute('required', ''));
    // إزالة سمات required من حقول الجرد
    inventoryFields.forEach(el => el.removeAttribute('required'));
  }
}

/**
 * دالة لإنشاء أزرار الفئات للمنتجات.
 * @param {Array} products - مصفوفة المنتجات.
 */
function createProductCategoryButtons(products) {
  productCategoriesDiv.innerHTML = '';
  const categories = [...new Set(products.map(p => p.Category))];

  categories.forEach(category => {
    const inputId = `cat-${category}`;
    const buttonHtml = `
      <div class="relative">
        <input type="radio" id="${inputId}" name="productCategory" value="${category}" class="hidden peer" />
        <label for="${inputId}" class="category-button">
          ${category}
        </label>
      </div>
    `;
    productCategoriesDiv.insertAdjacentHTML('beforeend', buttonHtml);
  });

  const allCategoryButtons = productCategoriesDiv.querySelectorAll('input[type="radio"]');
  allCategoryButtons.forEach(button => {
    button.addEventListener('change', (event) => {
      const selectedCategory = event.target.value;
      renderProducts(products.filter(p => p.Category === selectedCategory));
    });
  });

  // تحديد أول فئة بشكل افتراضي
  if (allCategoryButtons.length > 0) {
    allCategoryButtons[0].checked = true;
    allCategoryButtons[0].dispatchEvent(new Event('change'));
  }
}

/**
 * دالة لعرض المنتجات بناءً على الفئة المختارة.
 * @param {Array} products - مصفوفة المنتجات.
 */
function renderProducts(products) {
  productsDisplayDiv.innerHTML = '';
  products.forEach(product => {
    const productHtml = `
      <div class="product-item">
        <span class="font-medium text-gray-800">${product.Product_Name_AR}</span>
        <div class="radio-group flex gap-4">
          <label class="flex items-center">
            <input type="radio" name="product_${product.Product_Name_AR}" value="متوفر" class="form-radio h-4 w-4 text-green-600" checked />
            <span class="ml-1 text-green-600">متوفر ✅</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="product_${product.Product_Name_AR}" value="غير متوفر" class="form-radio h-4 w-4 text-red-600" />
            <span class="ml-1 text-red-600">غير متوفر ❌</span>
          </label>
        </div>
      </div>
    `;
    productsDisplayDiv.insertAdjacentHTML('beforeend', productHtml);
  });
}

/**
 * دالة لإضافة حقل جديد لمنتج الجرد.
 */
function addInventoryItem() {
  const template = `
    <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label>البحث عن المنتج</label>
          <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث..." />
        </div>
        <div class="form-group">
          <label>الكمية</label>
          <input type="number" name="Inventory_Quantity" min="1" placeholder="أدخل الكمية" />
        </div>
        <div class="form-group">
          <label>تاريخ الانتهاء</label>
          <input type="date" name="Expiration_Date" />
        </div>
        <div class="form-group">
          <label>الوحدة</label>
          <select name="Unit_Label">
            <option value="">اختر الوحدة</option>
            <option value="علبة">علبة</option>
            <option value="شد">شد</option>
            <option value="باكت">باكت</option>
          </select>
        </div>
      </div>
      <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
    </div>
  `;
  const newItem = document.createRange().createContextualFragment(template);
  inventoryItemsContainer.appendChild(newItem);

  // تحديث سمات required بعد إضافة العنصر الجديد
  toggleVisitSections(visitTypeSelect.value);
}

/**
 * دالة لإرسال بيانات النموذج.
 * @param {Event} event - حدث الإرسال (submit event).
 */
async function handleSubmit(event) {
  event.preventDefault();

  // التحقق من صلاحية النموذج قبل الإرسال
  if (!visitForm.checkValidity()) {
    // يمكنك إضافة رسالة تنبيه هنا إذا لزم الأمر
    return;
  }

  showLoading(true);

  // جمع البيانات من النموذج
  const formData = new FormData(visitForm);
  const data = Object.fromEntries(formData.entries());

  data.Timestamp = new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' });

  // معالجة البيانات الإضافية بناءً على نوع الزيارة
  if (data.Visit_Type_Name_AR === 'جرد استثنائي') {
    const inventoryItems = [];
    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(item => {
      const itemData = {
        Inventory_Product_Name_AR: item.querySelector('input[name="Inventory_Product_Name_AR"]').value,
        Inventory_Quantity: item.querySelector('input[name="Inventory_Quantity"]').value,
        Expiration_Date: item.querySelector('input[name="Expiration_Date"]').value,
        Unit_Label: item.querySelector('select[name="Unit_Label"]').value
      };
      inventoryItems.push(itemData);
    });
    data.Inventory_Items = JSON.stringify(inventoryItems);
  } else {
    // هذه هي الحالة التي يتم فيها إرسال بيانات الزيارة العادية
    const productsStatus = [];
    productsDisplayDiv.querySelectorAll('.product-item').forEach(product => {
      const productName = product.querySelector('span').textContent;
      const productStatus = product.querySelector('input[type="radio"]:checked').value;
      productsStatus.push({
        Product_Name_AR: productName,
        Status: productStatus
      });
    });
    data.Products_Status = JSON.stringify(productsStatus);
  }

  // Debugging: عرض البيانات في الكونسول قبل إرسالها
  console.log('Data to be sent:', data);

  // إرسال البيانات
  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      body: new URLSearchParams(data)
    });

    if (response.ok) {
      showSuccessMessage('تم إرسال البيانات بنجاح!');
      visitForm.reset();
      // إعادة تحميل الفئات والمنتجات بعد الإرسال
      createProductCategoryButtons(productsData);
      // إعادة تعيين حالة الأقسام بعد إعادة ضبط النموذج
      toggleVisitSections(visitTypeSelect.value);
    } else {
      throw new Error('حدث خطأ في استجابة الخادم.');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.');
  } finally {
    showLoading(false);
  }
}

// ---------------------------------------------------
// دوال عرض الرسائل
// ---------------------------------------------------

function showLoading(isLoading) {
  if (isLoading) {
    loadingSpinner.classList.remove('hidden');
    submitBtn.disabled = true;
  } else {
    loadingSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

function showSuccessMessage(message) {
  Swal.fire({
    title: 'نجاح!',
    text: message,
    icon: 'success',
    confirmButtonText: 'حسنًا'
  });
}

function showErrorMessage(message) {
  Swal.fire({
    title: 'خطأ!',
    text: message,
    icon: 'error',
    confirmButtonText: 'فهمت'
  });
}

function showWarningMessage(message) {
  Swal.fire({
    title: 'تنبيه',
    text: message,
    icon: 'warning',
    confirmButtonText: 'موافق'
  });
}

// --------------------------------------------------
// الأحداث عند تحميل الصفحة
// --------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadAllData(); // تحميل جميع البيانات الأولية

  // إضافة أول حقل لمنتج الجرد بدون سمة required
  const initialInventoryItemTemplate = `
    <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label>البحث عن المنتج</label>
          <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث..." />
        </div>
        <div class="form-group">
          <label>الكمية</label>
          <input type="number" name="Inventory_Quantity" min="1" placeholder="أدخل الكمية" />
        </div>
        <div class="form-group">
          <label>تاريخ الانتهاء</label>
          <input type="date" name="Expiration_Date" />
        </div>
        <div class="form-group">
          <label>الوحدة</label>
          <select name="Unit_Label">
            <option value="">اختر الوحدة</option>
            <option value="علبة">علبة</option>
            <option value="شد">شد</option>
            <option value="باكت">باكت</option>
          </select>
        </div>
      </div>
      <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
    </div>
  `;
  inventoryItemsContainer.innerHTML = initialInventoryItemTemplate;

  visitForm.addEventListener('submit', handleSubmit);

  visitTypeSelect.addEventListener('change', (event) => {
    toggleVisitSections(event.target.value);
  });

  addInventoryItemBtn.addEventListener('click', addInventoryItem);

  inventoryItemsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeInventoryItem')) {
      if (inventoryItemsContainer.children.length > 1) {
        event.target.closest('.inventory-item').remove();
      } else {
        showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
      }
    }
  });

  // تأكد من أن الحالة الأولية للنموذج صحيحة
  toggleVisitSections(visitTypeSelect.value);
});
