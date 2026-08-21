import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { user, roles } = useContext(AuthContext);

  if (!user) {
    return null;
  }

  return (
    <div className="card card-custom">
      <div className="card-body">
        <div className="text-center">
          <img
            src={user.picture}
            alt={user.name}
            width="150"
            className="rounded-circle border"
          />

          <h3 className="mt-3">{user.name}</h3>
        </div>

        <hr />

        <div className="table-responsive">
          <table className="table">
            <tbody>
              <tr>
                <th width="220">NIP</th>

                <td>{user.nip}</td>
              </tr>

              <tr>
                <th>Unit Kerja</th>

                <td>{user.unor_induk}</td>
              </tr>

              <tr>
                <th>Role</th>

                <td>{roles.join(", ")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
