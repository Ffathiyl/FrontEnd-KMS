import { useState, useEffect, useRef } from "react";
import { API_LINK } from "../../util/Constants";
import UseFetch from "../../util/UseFetch";
import Button from "../../part/Button";
import DropDown from "../../part/Dropdown";
import Input from "../../part/Input";
import Loading from "../../part/Loading";
import Alert from "../../part/Alert";
import Filter from "../../part/Filter";
import Icon from "../../part/Icon";
import SweetAlert from "../../util/SweetAlert";
import { ListKelompokKeahlian, ListProdi } from "../../util/Dummy";

export default function AnggotaDetail({ onChangePage, withID }) {
  const [errors, setErrors] = useState({});
  const [isError, setIsError] = useState({ error: false, message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const data = ListKelompokKeahlian.find((item) => item.data.id === withID);
  const [listAnggota, setListAnggota] = useState([]);
  const [listDosen, setListDosen] = useState([]);
  const [currentFilter, setCurrentFilter] = useState({
    page: 1,
    query: "",
    sort: "[Nama Anggota] asc",
    status: "Aktif",
    kke_id: withID.id, // Initializing with withID.id
  });

  const [currentDosenFilter, setCurrentDosenFilter] = useState({
    kke_id: ""
  });

  const searchAnggotaQuery = useRef();

  const handleAnggotaSearch = () => {
    setCurrentFilter((prevFilter) => ({
      ...prevFilter,
      page: 1,
      query: searchAnggotaQuery.current.value || "",
    }));
  };

  const formDataRef = useRef({
    key: "",
    nama: "",
    programStudi: "",
    personInCharge: "",
    deskripsi: "",
    status: "",
  });

  const fetchDataAnggota = async (idKK) => {
    setIsError({ error: false, message: "" });
    setIsLoading(true);

    const dataToSend = { ...currentFilter, kke_id: idKK };

    try {
      const data = await UseFetch(API_LINK + "AnggotaKK/GetAnggotaKK", dataToSend);

      if (data === "ERROR") {
        throw new Error("Terjadi kesalahan: Gagal mengambil daftar karyawan.");
      } else {
        setListAnggota(data);
      }
    } catch (error) {
      setIsError({ error: true, message: error.message });
      setListAnggota([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (withID) {
      formDataRef.current = {
        key: withID.id,
        nama: withID.title,
        programStudi: withID.prodi.nama,
        personInCharge: withID.pic.nama,
        deskripsi: withID.desc,
        status: withID.status,
      };
      setCurrentFilter((prevFilter) => ({
        ...prevFilter,
        kke_id: withID.id,
      }));
    }
  }, [withID]);

  useEffect(() => {
    if (withID) {
      fetchDataAnggota(withID.id);
    }
  }, [withID, currentFilter]);

  useEffect(() => {
    setIsError(false);
    
    if (formDataRef.current.key) { // Periksa apakah formDataRef.key memiliki nilai sebelum memanggil API
      UseFetch(API_LINK + "AnggotaKK/GetListDosen", { idKK: formDataRef.current.key })
        .then((data) => {
          if (data === "ERROR") setIsError(true);
          else {
            setListDosen(data);
          }
        })
        .then(() => setIsLoading(false))
        .catch((error) => {
          setIsError(true);
          console.error("Error fetching list of dosen:", error);
        });
    }
  }, [formDataRef.current.key]); // Gunakan formDataRef.current.key sebagai dependency useEffect
  

  function handleSetCurrentPage(newCurrentPage) {
    setIsLoading(true);
    setCurrentFilter((prevFilter) => {
      return {
        ...prevFilter,
        page: newCurrentPage,
      };
    });
  }

  const handleDelete = (id) => () => {
    setIsLoading(true);
    setIsError(false);

    SweetAlert(
      "Konfirmasi Hapus",
      "Anda yakin ingin mengeluarkan anggota ini dari Keahlian?",
      "warning",
      "Ya"
    ).then((confirm) => {
      if (confirm) {
        UseFetch(API_LINK + "AnggotaKK/SetStatusAnggotaKK", {
          idAkk: id, status: "Tidak Aktif"
        })
          .then((data) => {
            if (data === "ERROR" || data.length === 0) setIsError(true);
            else {
              SweetAlert("Berhasil", "Karyawan telah dihapus dari Anggota Keahlian.", "success");
              handleSetCurrentPage(currentFilter.page);
            }
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
        console.log("Penghapusan dibatalkan.");
      }
    });
  };

  const handleTambahAnggota = (id) => () => {
    setIsLoading(true);
    setIsError(false);

    UseFetch(API_LINK + "AnggotaKK/TambahAnggotaByPIC", {
      idAkk: formDataRef.current.key, kry: id
    })
      .then((data) => {
        if (data === "ERROR" || data.length === 0) setIsError(true);
        else {
          SweetAlert("Berhasil", "Karyawan telah ditambahkan ke Anggota Keahlian.", "success");
          handleSetCurrentPage(currentFilter.page);
        }
      })
      .finally(() => setIsLoading(false));
  };

  if (isLoading) return <Loading />;

  return (
    <>
      {isError.error && (
        <div className="flex-fill">
          <Alert type="danger" message={isError.message} />
        </div>
      )}
      <div className="d-flex flex-column">
        <div className="flex-fill">
          <div className="container">
            <div className="row pt-2">
              <div className="col-lg-7 px-4">
                <div className="card">
                  <div className="card-header bg-primary fw-medium text-white">
                    Anggota Kelompok Keahlian
                  </div>
                  <div className="card-body">
                    <h3 className="mb-2 fw-semibold">{formDataRef.current.nama}</h3>
                    <h6 className="fw-semibold">
                      <span
                        className="bg-primary me-2"
                        style={{ padding: "2px" }}
                      ></span>
                      {formDataRef.current.programStudi}
                    </h6>
                    <div className="pt-2 ps-2">
                      <Icon
                        name="user"
                        cssClass="p-0 ps-1 text-dark"
                        title="PIC Kelompok Keahlian"
                      />{" "}
                      <span>PIC : {formDataRef.current.personInCharge}</span>
                    </div>
                    <hr className="mb-0" style={{ opacity: "0.2" }} />
                    <p className="pt-2">{formDataRef.current.deskripsi}</p>
                    <hr style={{ opacity: "0.2" }} />
                    <h6 className="fw-semibold mt-4">Daftar Anggota</h6>
                    <div className="input-group mb-3">
                      <Input
                        ref={searchAnggotaQuery}
                        forInput="pencarianProduk"
                        placeholder="Cari"
                      />
                      <Button
                        iconName="search"
                        classType="primary px-4"
                        title="Cari"
                        onClick={handleAnggotaSearch}
                      />
                    </div>
                    {listAnggota.length > 0 ? (
                      listAnggota.map((ag, index) => (
                        <div className="card-profile mb-3 d-flex justify-content-between shadow-sm">
                          <div className="d-flex w-100">
                            <p className="mb-0 px-1 py-2 mt-2 me-2 fw-bold text-primary">
                              {index + 1}
                            </p>
                            <div
                              className="bg-primary"
                              style={{ width: "1.5%" }}
                            ></div>
                            <div className="p-1 ps-2 d-flex">
                              <img
                                src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-2.webp"
                                alt={ag["Nama Anggota"]}
                                className="img-fluid rounded-circle"
                                width="45"
                              />
                              <div className="ps-3">
                                <p className="mb-0">{ag["Nama Anggota"]}</p>
                                <p className="mb-0" style={{ fontSize: "13px" }}>
                                  {ag.Prodi}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <Icon
                              name="square-minus"
                              type="Bold"
                              cssClass="btn px-2 py-0 text-primary"
                              title="Hapus Anggota"
                              onClick={handleDelete(ag.Key)}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No data available</p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    classType="secondary me-2 px-4 py-2"
                    label="Kembali"
                    onClick={() => onChangePage("index")}
                  />
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card">
                  <div className="card-header bg-primary fw-medium text-white">
                    Tambah Anggota
                  </div>
                  <div className="card-body">
                    <div className="input-group mb-3">
                      <Input
                        // ref={searchQuery}
                        forInput="pencarianProduk"
                        placeholder="Cari"
                      />
                      <Button
                        iconName="search"
                        classType="primary px-4"
                        title="Cari"
                      // onClick={handleSearch}
                      />
                      <Filter>
                        <DropDown
                          // ref={searchFilterJenis}
                          forInput="ddProdi"
                          label="Program Studi"
                          type="semua"
                          arrData={ListProdi}
                          defaultValue=""
                        />
                      </Filter>
                    </div>
                    {listDosen.map((value) => (
                      <div>
                        <h6 className="fw-semibold mb-3">{value.Text}</h6>
                        <div className="card-profile mb-3 d-flex justify-content-between shadow-sm">
                          <div className="d-flex w-100">
                            <div
                              className="bg-primary"
                              style={{ width: "1.5%" }}
                            ></div>
                            <div className="p-1 ps-2 d-flex">
                              <img
                                src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-4.webp"
                                alt="Revalina"
                                className="img-fluid rounded-circle"
                                width="45"
                              />
                              <div className="ps-3">
                                <p className="mb-0">{value["Nama Karyawan"]}</p>
                                <p
                                  className="mb-0"
                                  style={{ fontSize: "13px" }}
                                >
                                  {value.Prodi}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <Icon
                              name="plus"
                              type="Bold"
                              cssClass="btn px-2 py-0 text-primary"
                              title="Tambah Menjadi Anggota"
                              onClick={handleTambahAnggota(value.Key)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
