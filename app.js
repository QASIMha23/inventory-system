// ======================================================
// SUPABASE CONFIGURATION
// ======================================================

const SUPABASE_URL = "https://fgmkgskvcxmefsaidkgi.supabase.co/";

const SUPABASE_KEY = "sb_publishable_aBhNqSEabLliyJK1xs0qaw_YobeNYuK";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================================
// GLOBAL STATE
// ======================================================

let inventoryData = [];


// ======================================================
// HELPERS
// ======================================================

function $(id) {
    return document.getElementById(id);
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function statusLabel(status) {

    switch (status) {

        case "normal":
            return `<span class="status status-normal">🟢 طبيعي</span>`;

        case "low":
            return `<span class="status status-low">🟠 منخفض</span>`;

        case "purchase":
            return `<span class="status status-purchase">🔴 يجب الشراء</span>`;

        case "out_of_stock":
            return `<span class="status status-out">🔴 نفد</span>`;

        default:
            return "";
    }
}


function today() {

    return new Date()
        .toISOString()
        .slice(0, 10);
}


// ======================================================
// AUTH
// ======================================================

async function checkUser() {

    const {
        data,
        error
    } = await supabaseClient
        .auth
        .getSession();

    if (error) {

        console.error(error);

        return;
    }

    if (data.session) {

        showApp(data.session.user);

    } else {

        showLogin();
    }
}


function showLogin() {

    $("loginScreen")
        .classList
        .remove("hidden");

    $("app")
        .classList
        .add("hidden");
}


function showApp(user) {

    $("loginScreen")
        .classList
        .add("hidden");

    $("app")
        .classList
        .remove("hidden");

    $("currentUser")
        .textContent = user.email;

    loadDashboard();
}


// ======================================================
// LOGIN
// ======================================================

async function login() {

    const email =
        $("email").value.trim();

    const password =
        $("password").value;

    $("loginMessage")
        .textContent = "جاري الدخول...";

    const {
        data,
        error
    } = await supabaseClient
        .auth
        .signInWithPassword({
            email,
            password
        });

    if (error) {

        $("loginMessage")
            .textContent =
            "خطأ: " + error.message;

        return;
    }

    showApp(data.user);
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    await supabaseClient
        .auth
        .signOut();

    showLogin();
}


// ======================================================
// LOAD INVENTORY
// ======================================================

async function loadInventory() {

    const {
        data,
        error
    } = await supabaseClient
        .from("inventory_status")
        .select("*")
        .order("product_name");

    if (error) {

        console.error(error);

        alert(
            "حدث خطأ أثناء تحميل المخزون"
        );

        return [];
    }

    inventoryData = data || [];

    return inventoryData;
}


// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {

    const data =
        await loadInventory();

    const total =
        data.length;

    const low =
        data.filter(
            x => x.stock_status === "low"
        ).length;

    const purchase =
        data.filter(
            x =>
                x.stock_status === "purchase"
                ||
                x.stock_status === "out_of_stock"
        ).length;

    const out =
        data.filter(
            x =>
                x.stock_status ===
                "out_of_stock"
        ).length;


    $("totalProducts")
        .textContent = total;

    $("lowProducts")
        .textContent = low;

    $("purchaseProducts")
        .textContent = purchase;

    $("outProducts")
        .textContent = out;


    renderPurchaseTable(
        data.filter(
            x =>
                x.stock_status ===
                "purchase"
                ||
                x.stock_status ===
                "out_of_stock"
        )
    );


    renderLowTable(
        data.filter(
            x =>
                x.stock_status ===
                "low"
        )
    );
}


// ======================================================
// PURCHASE TABLE
// ======================================================

function renderPurchaseTable(data) {

    if (!data.length) {

        $("purchaseTable")
            .innerHTML =
            "<p>لا توجد أصناف تحتاج شراء حاليًا.</p>";

        return;
    }

    let html = `

        <table>

            <thead>

                <tr>

                    <th>الصنف</th>
                    <th>الرصيد</th>
                    <th>الحد الأدنى</th>
                    <th>الوحدة</th>
                    <th>الحالة</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.product_name
                    )}
                </td>

                <td>
                    ${item.current_stock}
                </td>

                <td>
                    ${item.minimum_stock}
                </td>

                <td>
                    ${escapeHtml(
                        item.unit_name
                    )}
                </td>

                <td>
                    ${statusLabel(
                        item.stock_status
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;

    $("purchaseTable")
        .innerHTML = html;
}


// ======================================================
// LOW STOCK TABLE
// ======================================================

function renderLowTable(data) {

    if (!data.length) {

        $("lowTable")
            .innerHTML =
            "<p>لا توجد أصناف منخفضة المخزون.</p>";

        return;
    }

    let html = `

        <table>

            <thead>

                <tr>

                    <th>الصنف</th>
                    <th>الرصيد</th>
                    <th>حد التنبيه</th>
                    <th>الوحدة</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.product_name
                    )}
                </td>

                <td>
                    ${item.current_stock}
                </td>

                <td>
                    ${item.warning_stock}
                </td>

                <td>
                    ${escapeHtml(
                        item.unit_name
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;

    $("lowTable")
        .innerHTML = html;
}


// ======================================================
// PRODUCTS
// ======================================================

async function loadProducts() {

    const data =
        await loadInventory();

    renderProducts(
        data
    );
}


function renderProducts(data) {

    let html = `

        <table>

            <thead>

                <tr>

                    <th>الكود</th>
                    <th>الصنف</th>
                    <th>الوحدة</th>
                    <th>الرصيد</th>
                    <th>الحد الأدنى</th>
                    <th>الحالة</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.product_code
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.product_name
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.unit_name
                    )}
                </td>

                <td>
                    ${item.current_stock}
                </td>

                <td>
                    ${item.minimum_stock}
                </td>

                <td>
                    ${statusLabel(
                        item.stock_status
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;

    $("productsTable")
        .innerHTML = html;
}


// ======================================================
// LOAD PRODUCT SELECTS
// ======================================================

async function loadProductSelects() {

    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select(
            "id, product_code, product_name"
        )
        .eq("active", true)
        .order("product_name");


    if (error) {

        console.error(error);

        return;
    }


    const options = data
        .map(
            p =>
                `<option value="${p.id}">
                    ${escapeHtml(
                        p.product_name
                    )}
                </option>`
        )
        .join("");


    $("transactionProduct")
        .innerHTML =
        `<option value="">
            اختر الصنف
        </option>` + options;


    $("adjustProduct")
        .innerHTML =
        `<option value="">
            اختر الصنف
        </option>` + options;
}


// ======================================================
// SAVE TRANSACTION
// ======================================================

async function saveTransaction() {

    const productId =
        $("transactionProduct").value;

    const type =
        $("transactionType").value;

    const quantity =
        Number(
            $("transactionQuantity").value
        );

    const notes =
        $("transactionNotes")
            .value
            .trim();


    if (!productId) {

        alert("اختر الصنف");

        return;
    }


    if (!quantity || quantity <= 0) {

        alert("أدخل كمية صحيحة");

        return;
    }


    if (type === "out") {

        const item =
            inventoryData.find(
                x =>
                    x.id === productId
            );

        if (
            item &&
            quantity >
            Number(
                item.current_stock
            )
        ) {

            alert(
                "الكمية المطلوبة أكبر من الرصيد الحالي."
            );

            return;
        }
    }


    const {
        data: {
            user
        }
    } =
        await supabaseClient
            .auth
            .getUser();


    const {
        error
    } = await supabaseClient
        .from("transactions")
        .insert({

            product_id:
                productId,

            transaction_date:
                today(),

            transaction_type:
                type,

            quantity:
                quantity,

            notes:
                notes || null,

            created_by:
                user.id
        });


    if (error) {

        console.error(error);

        alert(
            "حدث خطأ: " +
            error.message
        );

        return;
    }


    alert("تم حفظ الحركة بنجاح");


    $("transactionQuantity")
        .value = "";

    $("transactionNotes")
        .value = "";


    await loadDashboard();

    await loadTodayTransactions();
}


// ======================================================
// TODAY TRANSACTIONS
// ======================================================

async function loadTodayTransactions() {

    const {
        data,
        error
    } = await supabaseClient
        .from("transactions")
        .select(`
            id,
            transaction_date,
            transaction_type,
            quantity,
            notes,
            product_id,
            products (
                product_name
            )
        `)
        .eq(
            "transaction_date",
            today()
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        return;
    }


    if (!data.length) {

        $("todayTransactions")
            .innerHTML =
            "<p>لا توجد حركات اليوم.</p>";

        return;
    }


    let html = `

        <table>

            <thead>

                <tr>

                    <th>الصنف</th>
                    <th>الحركة</th>
                    <th>الكمية</th>
                    <th>الملاحظات</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.products
                            ?.product_name
                    )}
                </td>

                <td>
                    ${
                        item.transaction_type
                        === "in"
                        ? "📥 وارد"
                        : "📤 صادر"
                    }
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ${escapeHtml(
                        item.notes || ""
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;


    $("todayTransactions")
        .innerHTML = html;
}


// ======================================================
// SAVE ADJUSTMENT
// ======================================================

async function saveAdjustment() {

    const productId =
        $("adjustProduct").value;

    const actual =
        Number(
            $("actualQuantity").value
        );

    const reason =
        $("adjustReason")
            .value
            .trim();


    if (!productId) {

        alert("اختر الصنف");

        return;
    }


    if (
        Number.isNaN(actual)
        ||
        actual < 0
    ) {

        alert(
            "أدخل كمية صحيحة"
        );

        return;
    }


    const item =
        inventoryData.find(
            x =>
                x.id === productId
        );


    if (!item) {

        alert(
            "تعذر العثور على الصنف"
        );

        return;
    }


    const {
        data: {
            user
        }
    } =
        await supabaseClient
            .auth
            .getUser();


    const {
        error
    } =
        await supabaseClient
            .from("stock_adjustments")
            .insert({

                product_id:
                    productId,

                adjustment_date:
                    today(),

                system_quantity:
                    Number(
                        item.current_stock
                    ),

                actual_quantity:
                    actual,

                reason:
                    reason || null,

                created_by:
                    user.id
            });


    if (error) {

        console.error(error);

        alert(
            "حدث خطأ: " +
            error.message
        );

        return;
    }


    alert(
        "تم تسجيل الجرد بنجاح"
    );


    $("actualQuantity")
        .value = "";

    $("adjustReason")
        .value = "";


    await loadDashboard();
}


// ======================================================
// PURCHASE PAGE
// ======================================================

async function loadPurchases() {

    const data =
        await loadInventory();


    const purchases =
        data.filter(
            x =>
                x.stock_status ===
                "purchase"
                ||
                x.stock_status ===
                "out_of_stock"
        );


    renderPurchaseTable(
        purchases
    );


    $("purchaseFullTable")
        .innerHTML =
        $("purchaseTable")
            .innerHTML;
}


// ======================================================
// NAVIGATION
// ======================================================

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(
            p =>
                p.classList
                    .add("hidden")
        );


    const pageElement =
        $(page + "Page");


    if (!pageElement) {
        return;
    }


    pageElement
        .classList
        .remove("hidden");


    const titles = {

        dashboard:
            "الرئيسية",

        products:
            "الأصناف",

        transactions:
            "حركة المخزون",

        purchases:
            "يجب الشراء",

        adjustments:
            "الجرد",

        reports:
            "التقارير",

        users:
            "المستخدمون"
    };


    $("pageTitle")
        .textContent =
        titles[page]
        || "نظام المخزون";


    if (page === "dashboard") {

        loadDashboard();

    }


    if (page === "products") {

        loadProducts();

    }


    if (page === "transactions") {

        $("todayDate")
            .textContent =
            today();

        loadProductSelects();

        loadTodayTransactions();

    }


    if (page === "purchases") {

        loadPurchases();

    }


    if (page === "adjustments") {

        loadProductSelects();

    }
}


// ======================================================
// EVENTS
// ======================================================

$("loginButton")
    .addEventListener(
        "click",
        login
    );


$("logoutButton")
    .addEventListener(
        "click",
        logout
    );


$("saveTransaction")
    .addEventListener(
        "click",
        saveTransaction
    );


$("saveAdjustment")
    .addEventListener(
        "click",
        saveAdjustment
    );


document
    .querySelectorAll(
        ".sidebar button[data-page]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


// ======================================================
// SEARCH
// ======================================================

$("productSearch")
    .addEventListener(
        "input",
        function () {

            const query =
                this.value
                    .trim()
                    .toLowerCase();


            const filtered =
                inventoryData.filter(
                    item =>
                        item.product_name
                            .toLowerCase()
                            .includes(query)
                        ||
                        item.product_code
                            .toLowerCase()
                            .includes(query)
                );


            renderProducts(
                filtered
            );

        }
    );


// ======================================================
// AUTH STATE
// ======================================================

supabaseClient
    .auth
    .onAuthStateChange(
        (_event, session) => {

            if (session) {

                showApp(
                    session.user
                );

            } else {

                showLogin();

            }

        }
    );


// ======================================================
// START
// ======================================================

checkUser();
/* =========================================================
   نظام إدارة الأصناف والمخازن والمصادر
========================================================= */

let warehousesData = [];
let sourcesData = [];


/* =========================================================
   تحميل المخازن
========================================================= */

async function loadWarehouses() {

    const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("active", true)
        .order("name");

    if (error) {
        console.error(error);
        return;
    }

    warehousesData = data || [];

    const warehouseSelect = document.getElementById("productWarehouse");

    if (warehouseSelect) {

        warehouseSelect.innerHTML =
            '<option value="">اختر المخزن</option>';

        warehousesData.forEach(warehouse => {

            warehouseSelect.innerHTML += `
                <option value="${warehouse.id}">
                    ${warehouse.name}
                </option>
            `;

        });

    }
}


/* =========================================================
   تحميل المصادر
========================================================= */

async function loadSources() {

    const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("active", true)
        .order("name");

    if (error) {
        console.error(error);
        return;
    }

    sourcesData = data || [];

    const sourceSelects = [
        document.getElementById("productSource"),
        document.getElementById("incomingSource")
    ];

    sourceSelects.forEach(select => {

        if (!select) return;

        select.innerHTML =
            '<option value="">اختر المصدر</option>';

        sourcesData.forEach(source => {

            select.innerHTML += `
                <option value="${source.id}">
                    ${source.name}
                </option>
            `;

        });

    });
}


/* =========================================================
   تحميل الوحدات
========================================================= */

async function loadProductUnits() {

    const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("active", true)
        .order("name");

    if (error) {
        console.error(error);
        return;
    }

    const select = document.getElementById("productUnit");

    if (!select) return;

    select.innerHTML =
        '<option value="">اختر الوحدة</option>';

    (data || []).forEach(unit => {

        select.innerHTML += `
            <option value="${unit.id}">
                ${unit.name}
            </option>
        `;

    });
}


/* =========================================================
   فتح نافذة إضافة صنف
========================================================= */

function openProductModal() {

    const modal = document.getElementById("productModal");

    if (!modal) return;

    modal.classList.add("show");

}


/* =========================================================
   إغلاق نافذة إضافة صنف
========================================================= */

function closeProductModal() {

    const modal = document.getElementById("productModal");

    if (!modal) return;

    modal.classList.remove("show");

}


/* =========================================================
   إنشاء رقم الصنف تلقائيًا
========================================================= */

async function generateProductCode() {

    const { count, error } = await supabase
        .from("products")
        .select("*", {
            count: "exact",
            head: true
        });

    if (error) {

        console.error(error);

        return "PR-" + Date.now();

    }

    const number = (count || 0) + 1;

    return "PR-" +
        String(number).padStart(6, "0");
}


/* =========================================================
   حفظ صنف جديد
========================================================= */

async function saveNewProduct(event) {

    event.preventDefault();

    const productName =
        document.getElementById("productName").value.trim();

    const unitId =
        document.getElementById("productUnit").value;

    const warehouseId =
        document.getElementById("productWarehouse").value;

    const sourceId =
        document.getElementById("productSource").value || null;

    const minimumStock =
        Number(document.getElementById("minimumStock").value || 0);

    const warningStock =
        Number(document.getElementById("warningStock").value || 0);

    const targetStock =
        Number(document.getElementById("targetStock").value || 0);

    const notes =
        document.getElementById("productNotes").value.trim();


    if (!productName || !unitId || !warehouseId) {

        alert("يرجى تعبئة اسم الصنف والوحدة والمخزن.");

        return;
    }


    const code = await generateProductCode();


    const {
        data: { user }
    } = await supabase.auth.getUser();


    const { error } = await supabase
        .from("products")
        .insert({

            product_code: code,
            product_name: productName,
            unit_id: unitId,
            warehouse_id: warehouseId,
            source_id: sourceId,
            minimum_stock: minimumStock,
            warning_stock: warningStock,
            target_stock: targetStock,
            notes: notes,
            active: true

        });


    if (error) {

        console.error(error);

        alert("حدث خطأ أثناء حفظ الصنف: " + error.message);

        return;
    }


    alert("تمت إضافة الصنف بنجاح.");

    document.getElementById("productForm").reset();

    closeProductModal();

    await loadInventory();

    await loadProductSelects();

    await loadProductsTable();

}


/* =========================================================
   تحميل الأصناف في قوائم الحركات
========================================================= */

async function loadMovementProducts() {

    const { data, error } = await supabase
        .from("inventory_status")
        .select("*")
        .order("product_name");

    if (error) {

        console.error(error);

        return;
    }


    const incoming =
        document.getElementById("incomingProduct");

    const outgoing =
        document.getElementById("outgoingProduct");


    [incoming, outgoing].forEach(select => {

        if (!select) return;

        select.innerHTML =
            '<option value="">اختر الصنف</option>';

        (data || []).forEach(product => {

            select.innerHTML += `
                <option value="${product.id}">
                    ${product.product_name}
                    — ${product.current_stock}
                    ${product.unit_name || ""}
                </option>
            `;

        });

    });

}


/* =========================================================
   تسجيل حركة دخول
========================================================= */

async function saveIncoming(event) {

    event.preventDefault();


    const productId =
        document.getElementById("incomingProduct").value;

    const quantity =
        Number(document.getElementById("incomingQuantity").value);

    const sourceId =
        document.getElementById("incomingSource").value || null;

    const notes =
        document.getElementById("incomingNotes").value.trim();


    if (!productId || quantity <= 0) {

        alert("يرجى اختيار الصنف وإدخال كمية صحيحة.");

        return;
    }


    const {
        data: { user }
    } = await supabase.auth.getUser();


    const product =
        inventoryData.find(p => p.id === productId);


    const warehouseId =
        product ? product.warehouse_id : null;


    const { error } = await supabase
        .from("transactions")
        .insert({

            product_id: productId,
            warehouse_id: warehouseId,
            source_id: sourceId,
            transaction_date: new Date()
                .toISOString()
                .slice(0, 10),

            transaction_type: "in",

            quantity: quantity,

            notes: notes,

            created_by: user.id

        });


    if (error) {

        alert("حدث خطأ: " + error.message);

        return;
    }


    alert("تم تسجيل الدخول إلى المخزن.");

    document.getElementById("incomingForm").reset();

    await loadInventory();

    await loadMovementProducts();

    await loadMovementTables();

}


/* =========================================================
   تسجيل حركة خروج
========================================================= */

async function saveOutgoing(event) {

    event.preventDefault();


    const productId =
        document.getElementById("outgoingProduct").value;

    const quantity =
        Number(document.getElementById("outgoingQuantity").value);

    const destination =
        document.getElementById("outgoingDestination").value.trim();

    const notes =
        document.getElementById("outgoingNotes").value.trim();


    if (!productId || quantity <= 0) {

        alert("يرجى اختيار الصنف وإدخال كمية صحيحة.");

        return;
    }


    const product =
        inventoryData.find(p => p.id === productId);


    if (!product) {

        alert("لم يتم العثور على الصنف.");

        return;
    }


    if (Number(product.current_stock) < quantity) {

        alert(
            "لا يمكن إخراج هذه الكمية. " +
            "المخزون الحالي هو: " +
            product.current_stock
        );

        return;
    }


    const {
        data: { user }
    } = await supabase.auth.getUser();


    const { error } = await supabase
        .from("transactions")
        .insert({

            product_id: productId,

            warehouse_id:
                product.warehouse_id || null,

            transaction_date:
                new Date()
                    .toISOString()
                    .slice(0, 10),

            transaction_type: "out",

            quantity: quantity,

            notes:
                destination
                    ? `الجهة: ${destination} ${notes ? " - " + notes : ""}`
                    : notes,

            created_by: user.id

        });


    if (error) {

        alert("حدث خطأ: " + error.message);

        return;
    }


    alert("تم تسجيل الخروج من المخزن.");

    document.getElementById("outgoingForm").reset();

    await loadInventory();

    await loadMovementProducts();

    await loadMovementTables();

}


/* =========================================================
   تحميل جدول حركات اليوم
========================================================= */

async function loadMovementTables() {

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);


    const { data, error } = await supabase
        .from("transactions")
        .select(`
            id,
            transaction_date,
            transaction_type,
            quantity,
            notes,
            product_id,
            created_at,
            products (
                product_name,
                unit_id
            )
        `)
        .eq("transaction_date", today)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        return;
    }


    const incomingBody =
        document.getElementById("incomingTableBody");

    const outgoingBody =
        document.getElementById("outgoingTableBody");


    if (incomingBody) incomingBody.innerHTML = "";

    if (outgoingBody) outgoingBody.innerHTML = "";


    (data || []).forEach(transaction => {

        const productName =
            transaction.products?.product_name || "—";


        const row = `
            <tr>
                <td>${productName}</td>
                <td>${transaction.quantity}</td>
                <td>${transaction.notes || "—"}</td>
                <td>${transaction.transaction_date}</td>
                <td>—</td>
            </tr>
        `;


        if (transaction.transaction_type === "in") {

            if (incomingBody) {
                incomingBody.innerHTML += row;
            }

        } else {

            if (outgoingBody) {
                outgoingBody.innerHTML += row;
            }

        }

    });

}


/* =========================================================
   جدول الأصناف
========================================================= */

async function loadProductsTable() {

    const { data, error } = await supabase
        .from("inventory_status")
        .select("*")
        .order("product_name");


    if (error) {

        console.error(error);

        return;
    }


    const body =
        document.getElementById("productsTableBody");

    if (!body) return;


    body.innerHTML = "";


    (data || []).forEach(product => {

        let statusText = "طبيعي";
        let statusClass = "status-normal";


        if (product.stock_status === "low") {

            statusText = "منخفض";
            statusClass = "status-low";

        }


        if (product.stock_status === "purchase") {

            statusText = "يجب الشراء";
            statusClass = "status-purchase";

        }


        if (product.stock_status === "out_of_stock") {

            statusText = "نفد المخزون";
            statusClass = "status-out";

        }


        const warehouse =
            warehousesData.find(
                w => w.id === product.warehouse_id
            );


        const source =
            sourcesData.find(
                s => s.id === product.source_id
            );


        body.innerHTML += `

            <tr>

                <td>
                    <strong>
                        ${product.product_name}
                    </strong>
                    <small>
                        ${product.product_code}
                    </small>
                </td>

                <td>
                    ${product.unit_name || "—"}
                </td>

                <td>
                    ${warehouse?.name || "—"}
                </td>

                <td>
                    ${source?.name || "—"}
                </td>

                <td>
                    <strong>
                        ${product.current_stock}
                    </strong>
                </td>

                <td>
                    ${product.minimum_stock}
                </td>

                <td>
                    <span class="${statusClass}">
                        ${statusText}
                    </span>
                </td>

            </tr>

        `;

    });

}


/* =========================================================
   تهيئة النظام الجديد
========================================================= */

async function initializeInventorySystem() {

    try {

        await loadWarehouses();

        await loadSources();

        await loadProductUnits();

        await loadProductsTable();

        await loadMovementProducts();

        await loadMovementTables();

    } catch (error) {

        console.error(
            "Inventory system initialization error:",
            error
        );

    }

}


/* =========================================================
   ربط الأزرار
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const addProductBtn =
        document.getElementById("addProductBtn");

    const closeProductModalBtn =
        document.getElementById("closeProductModal");

    const cancelProductBtn =
        document.getElementById("cancelProductBtn");

    const productForm =
        document.getElementById("productForm");

    const incomingForm =
        document.getElementById("incomingForm");

    const outgoingForm =
        document.getElementById("outgoingForm");


    if (addProductBtn) {

        addProductBtn.addEventListener(
            "click",
            openProductModal
        );

    }


    if (closeProductModalBtn) {

        closeProductModalBtn.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (cancelProductBtn) {

        cancelProductBtn.addEventListener(
            "click",
            closeProductModal
        );

    }


    if (productForm) {

        productForm.addEventListener(
            "submit",
            saveNewProduct
        );

    }


    if (incomingForm) {

        incomingForm.addEventListener(
            "submit",
            saveIncoming
        );

    }


    if (outgoingForm) {

        outgoingForm.addEventListener(
            "submit",
            saveOutgoing
        );

    }

});
