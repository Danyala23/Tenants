import { api } from "../../api";
import { useNotifications } from "../../context/NotificationContext";
import type { UtilityConnection } from "../../types";

interface UtilityConnectionsSectionProps {
  utilityConnections: UtilityConnection[];
  onEdit: (uc: UtilityConnection) => void;
  onAdd: () => void;
  onDataChange: () => void;
}

export function UtilityConnectionsSection({
  utilityConnections,
  onEdit,
  onAdd,
  onDataChange,
}: UtilityConnectionsSectionProps) {
  const { toast, confirm } = useNotifications();

  async function handleDelete(uc: UtilityConnection) {
    const ok = await confirm({
      message: "Delete this utility connection?",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.utilityConnections.delete(uc.id);
      onDataChange();
    } catch (e) {
      console.error(e);
      toast({ message: "Failed to delete", type: "error" });
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 section-heading">
          <i className="bi bi-plug" aria-hidden /> Utility Connections
        </h5>
        <button className="btn btn-sm btn-primary" onClick={onAdd}>
          <i className="bi bi-plus-lg" aria-hidden /> Add Connection
        </button>
      </div>
      {utilityConnections.length > 0 ? (
        <table className="table table-striped app-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Provider</th>
              <th>Reference / Consumer #</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {utilityConnections.map((uc) => (
              <tr key={uc.id}>
                <td>{uc.type}</td>
                <td>{uc.providerName || "—"}</td>
                <td>{uc.referenceNumber || uc.consumerNumber || "—"}</td>
                <td>
                  <div className="d-flex gap-1 justify-content-end">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onEdit(uc)}
                    >
                      <i className="bi bi-pencil" aria-hidden /> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(uc)}
                    >
                      <i className="bi bi-trash" aria-hidden /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">
          No utility connections. Add electricity (LESCO) or gas (SNGPL)
          connections to enable bill scraping.
        </p>
      )}
    </section>
  );
}
