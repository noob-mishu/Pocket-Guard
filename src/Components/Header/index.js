import React, { useEffect } from "react";
import "./styles.css";
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import userIms from "../Header/assets/user.svg";
import { getFirebaseErrorMessage } from "../../utils/firebaseErrors";

function Header() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, loading]);

  function logoutFnc() {
    signOut(auth)
      .then(() => {
        toast.success("Logged out.");
        navigate("/");
      })
      .catch((error) => {
        toast.error(getFirebaseErrorMessage(error));
      });
  }

  return (
    <div className="navbar">
      <button
        type="button"
        className="logo"
        onClick={() => navigate("/dashboard")}
      >
        <span className="logo-mark" aria-hidden="true">
          ৳
        </span>
        Yo Wallet
      </button>
      {user && (
        <>
          <nav className="nav-links" aria-label="Main">
            <Link className="nav-link" to="/dashboard">
              Dashboard
            </Link>
            <Link className="nav-link" to="/groups">
              Groups
            </Link>
            <Link className="nav-link" to="/budgets">
              Budgets
            </Link>
          </nav>
          <div className="nav-right">
            <img
              src={user.photoURL ? user.photoURL : userIms}
              className="avatar"
              alt="Your profile"
            />
            <button type="button" className="logo logout" onClick={logoutFnc}>
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
export default Header;
