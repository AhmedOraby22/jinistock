import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { defaultInspireItems } from "../data/defaultInspire.js";
import { resolveMediaUrl } from "../utils/mediaUrl.js";
import AppShell from "../components/layout/AppShell.jsx";

const emptyProductForm = {
  slug: "",
  name: "",
  description: "",
  priceEgp: "",
  imageCredits: "",
  videoCredits: "",
  sortOrder: "0",
  highlight: false,
  active: true,
};

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [creditForm, setCreditForm] = useState({
    imageCredits: "",
    videoCredits: "",
    mode: "set",
  });
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [inspireImages, setInspireImages] = useState([]);
  const [uploadFiles, setUploadFiles] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const uploadFormRef = useRef(null);

  const tabTitle =
    tab === "users" ? "Users & Credits" : tab === "products" ? "Subscription Products" : "Inspire Gallery";
  const tabSubtitle =
    tab === "users"
      ? "Search users, view balances, and manage credits."
      : tab === "products"
        ? "Add and edit credit packages shown on the Subscription page."
        : "Upload, preview, and delete images shown in the home page INSPIRE section.";

  const loadUsers = useCallback(async () => {
    const [statsRes, usersRes] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/users", { params: { page, limit: 25, q: search || undefined } }),
    ]);
    setStats(statsRes.data);
    setUsers(usersRes.data.users);
    setTotalPages(usersRes.data.totalPages);
    setTotal(usersRes.data.total);
  }, [page, search]);

  const loadPackages = useCallback(async () => {
    const { data } = await api.get("/admin/packages");
    setPackages(data.packages);
  }, []);

  const loadInspireImages = useCallback(async () => {
    const { data } = await api.get("/admin/inspire-images");
    setInspireImages(data.images);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "users") {
        await loadUsers();
      } else if (tab === "products") {
        await loadPackages();
      } else {
        await loadInspireImages();
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [navigate, tab, loadUsers, loadPackages, loadInspireImages]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    load();
  }, [load, navigate]);

  const openEdit = (user) => {
    setEditing(user);
    setCreditForm({
      imageCredits: String(user.imageCredits),
      videoCredits: String(user.videoCredits),
      mode: "set",
    });
  };

  const saveCredits = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/users/${editing.id}/credits`, {
        imageCredits: Number(creditForm.imageCredits),
        videoCredits: Number(creditForm.videoCredits),
        mode: creditForm.mode,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update credits");
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = async (user) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Set ${user.email} to ${nextRole}?`)) return;
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: nextRole });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update role");
    }
  };

  const openProductModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setProductForm({
        slug: product.slug,
        name: product.name,
        description: product.description || "",
        priceEgp: String(product.priceCents / 100),
        imageCredits: String(product.imageCredits),
        videoCredits: String(product.videoCredits),
        sortOrder: String(product.sortOrder),
        highlight: product.highlight,
        active: product.active,
      });
    } else {
      setProductForm(emptyProductForm);
    }
    setShowProductModal(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        slug: productForm.slug,
        name: productForm.name,
        description: productForm.description || null,
        priceEgp: Number(productForm.priceEgp),
        imageCredits: Number(productForm.imageCredits),
        videoCredits: Number(productForm.videoCredits),
        sortOrder: Number(productForm.sortOrder),
        highlight: productForm.highlight,
        active: productForm.active,
      };

      if (editingProduct) {
        await api.patch(`/admin/packages/${editingProduct.id}`, payload);
      } else {
        await api.post("/admin/packages", payload);
      }

      setShowProductModal(false);
      setEditingProduct(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  const deactivateProduct = async (product) => {
    if (!window.confirm(`Deactivate "${product.name}"? It will no longer appear on the buy page.`)) return;
    try {
      await api.delete(`/admin/packages/${product.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not deactivate product");
    }
  };

  const reactivateProduct = async (product) => {
    try {
      await api.patch(`/admin/packages/${product.id}`, { active: true });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not reactivate product");
    }
  };

  const uploadInspireImages = async (e) => {
    e.preventDefault();
    if (!uploadFiles?.length) {
      setError("Choose at least one image to upload");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      Array.from(uploadFiles).forEach((file) => body.append("files", file));
      if (uploadTitle.trim()) body.append("title", uploadTitle.trim());
      await api.post("/admin/inspire-images", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadFiles(null);
      setUploadTitle("");
      uploadFormRef.current?.reset();
      await loadInspireImages();
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload images");
    } finally {
      setUploading(false);
    }
  };

  const deleteInspireImage = async (image) => {
    if (!window.confirm("Delete this image from the INSPIRE gallery?")) return;
    try {
      await api.delete(`/admin/inspire-images/${image.id}`);
      await loadInspireImages();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete image");
    }
  };

  const toggleInspireImage = async (image) => {
    try {
      await api.patch(`/admin/inspire-images/${image.id}`, { active: !image.active });
      await loadInspireImages();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update image");
    }
  };

  return (
    <AppShell>
    <div className="admin-page oa-legacy-page">
      <div className="dashboard-hero">
        <div className="container dashboard-hero-inner">
          <div>
            <p className="dashboard-eyebrow">Admin</p>
            <h1>{tabTitle}</h1>
            <p className="dashboard-sub">{tabSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="container dashboard-body">
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === "products" ? "active" : ""}`}
            onClick={() => setTab("products")}
          >
            Products
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === "gallery" ? "active" : ""}`}
            onClick={() => setTab("gallery")}
          >
            Gallery
          </button>
        </div>

        {tab === "users" && stats && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <span className="stat-label">Users</span>
              <strong>{stats.users}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total image credits</span>
              <strong>{stats.totalImageCredits}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total video credits</span>
              <strong>{stats.totalVideoCredits}</strong>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="card admin-toolbar">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setSearch(q.trim());
              }}
              className="admin-search"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or email"
              />
              <button className="btn-primary" type="submit" style={{ width: "auto" }}>
                Search
              </button>
            </form>
            <span className="admin-count">{total} users</span>
          </div>
        )}

        {tab === "products" && (
          <div className="card admin-toolbar">
            <span className="admin-count">{packages.length} products</span>
            <button
              type="button"
              className="btn-primary"
              style={{ width: "auto" }}
              onClick={() => openProductModal()}
            >
              Add product
            </button>
          </div>
        )}

        {tab === "gallery" && (
          <div className="card admin-gallery-upload">
            <h3>Upload images</h3>
            <p className="modal-sub">Images appear in the home page INSPIRE carousel.</p>
            <form ref={uploadFormRef} onSubmit={uploadInspireImages}>
              <label>Image files</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
                required
              />
              <label>Title (optional, applies to all uploads)</label>
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Portrait inspiration"
              />
              <button className="btn-primary" type="submit" disabled={uploading} style={{ width: "auto" }}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        )}

        {error && <div className="notice warn">{error}</div>}

        {tab === "users" && (
          <>
            <div className="card admin-table-wrap">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Image</th>
                      <th>Video</th>
                      <th>Used</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-user-cell">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`role-pill ${user.role}`}>{user.role}</span>
                        </td>
                        <td>{user.imageCredits}</td>
                        <td>{user.videoCredits}</td>
                        <td>{user.creditsUsed}</td>
                        <td className="admin-actions">
                          <button type="button" className="btn-outline" onClick={() => openEdit(user)}>
                            Credits
                          </button>
                          <button type="button" className="btn-outline" onClick={() => toggleRole(user)}>
                            {user.role === "admin" ? "Demote" : "Make admin"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!users.length && (
                      <tr>
                        <td colSpan={6}>No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                className="btn-outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}

        {tab === "products" && (
          <div className="card admin-table-wrap">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Image credits</th>
                    <th>Video credits</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-user-cell">
                          <strong>{product.name}</strong>
                          <span>{product.slug}</span>
                        </div>
                      </td>
                      <td>{product.priceCents / 100} EGP</td>
                      <td>{product.imageCredits}</td>
                      <td>{product.videoCredits}</td>
                      <td>
                        <span className={`role-pill ${product.active ? "admin" : ""}`}>
                          {product.active ? "Active" : "Inactive"}
                        </span>
                        {product.highlight && <span className="role-pill" style={{ marginLeft: 6 }}>Featured</span>}
                      </td>
                      <td className="admin-actions">
                        <button type="button" className="btn-outline" onClick={() => openProductModal(product)}>
                          Edit
                        </button>
                        {product.active ? (
                          <button type="button" className="btn-outline" onClick={() => deactivateProduct(product)}>
                            Deactivate
                          </button>
                        ) : (
                          <button type="button" className="btn-outline" onClick={() => reactivateProduct(product)}>
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!packages.length && (
                    <tr>
                      <td colSpan={6}>No products yet. Click &quot;Add product&quot; to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "gallery" && (
          <div className="admin-gallery-section">
            <div className="admin-toolbar" style={{ marginBottom: 12 }}>
              <span className="admin-count">{inspireImages.length} images</span>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="admin-gallery-grid">
                {inspireImages.map((image) => (
                  <div key={image.id} className={`admin-gallery-card${image.active ? "" : " inactive"}`}>
                    <img src={resolveMediaUrl(image.url)} alt={image.title || "Inspire"} loading="lazy" />
                    <div className="admin-gallery-meta">
                      <span>{image.title || "Untitled"}</span>
                      <span className={`role-pill ${image.active ? "admin" : ""}`}>
                        {image.active ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <div className="admin-gallery-actions">
                      <button type="button" className="btn-outline" onClick={() => toggleInspireImage(image)}>
                        {image.active ? "Hide" : "Show"}
                      </button>
                      <button type="button" className="btn-outline" onClick={() => deleteInspireImage(image)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!inspireImages.length && (
                  <p className="admin-gallery-empty">No uploaded images yet. Upload images above to show them before the default gallery.</p>
                )}
              </div>
            )}

            <div className="admin-gallery-defaults">
              <h3>Default images</h3>
              <p className="modal-sub">These stock images always appear after your uploads on the home page.</p>
              <div className="admin-gallery-grid">
                {defaultInspireItems().map((image) => (
                  <div key={image.id} className="admin-gallery-card">
                    <img src={image.url} alt={image.title} loading="lazy" />
                    <div className="admin-gallery-meta">
                      <span>{image.title}</span>
                      <span className="role-pill admin">Built-in</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Manage credits</h3>
            <p className="modal-sub">{editing.email}</p>
            <form onSubmit={saveCredits}>
              <label>Mode</label>
              <select
                value={creditForm.mode}
                onChange={(e) => setCreditForm({ ...creditForm, mode: e.target.value })}
              >
                <option value="set">Set exact balance</option>
                <option value="add">Add to current balance</option>
              </select>
              <label>Image credits</label>
              <input
                type="number"
                min="0"
                value={creditForm.imageCredits}
                onChange={(e) => setCreditForm({ ...creditForm, imageCredits: e.target.value })}
                required
              />
              <label>Video credits</label>
              <input
                type="number"
                min="0"
                value={creditForm.videoCredits}
                onChange={(e) => setCreditForm({ ...creditForm, videoCredits: e.target.value })}
                required
              />
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button className="btn-primary" type="submit" disabled={saving} style={{ width: "auto" }}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-backdrop" onClick={() => setShowProductModal(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? "Edit product" : "Add product"}</h3>
            <p className="modal-sub">Shown on the Subscription & Credits page.</p>
            <form onSubmit={saveProduct}>
              <label>Name</label>
              <input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="PRO"
                required
              />
              <label>Slug (URL id)</label>
              <input
                value={productForm.slug}
                onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                placeholder="pro"
                required
              />
              <label>Price (EGP)</label>
              <input
                type="number"
                min="1"
                value={productForm.priceEgp}
                onChange={(e) => setProductForm({ ...productForm, priceEgp: e.target.value })}
                required
              />
              <label>Image credits</label>
              <input
                type="number"
                min="1"
                value={productForm.imageCredits}
                onChange={(e) => setProductForm({ ...productForm, imageCredits: e.target.value })}
                required
              />
              <label>Video credits</label>
              <input
                type="number"
                min="1"
                value={productForm.videoCredits}
                onChange={(e) => setProductForm({ ...productForm, videoCredits: e.target.value })}
                required
              />
              <label>Sort order</label>
              <input
                type="number"
                min="0"
                value={productForm.sortOrder}
                onChange={(e) => setProductForm({ ...productForm, sortOrder: e.target.value })}
              />
              <label>Description (optional)</label>
              <input
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Best value for creators"
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={productForm.highlight}
                  onChange={(e) => setProductForm({ ...productForm, highlight: e.target.checked })}
                />
                Featured (pink border on buy page)
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={productForm.active}
                  onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                />
                Active (visible on buy page)
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowProductModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" type="submit" disabled={saving} style={{ width: "auto" }}>
                  {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}
