import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import "./App.css";
function App() {
  const [ipAddress, setIpAddress] = useState(["", "", "", ""]);
  const [mask, setMask] = useState("");
  const [user, setUser] = useState("");
  const [subNetwork, setSubNetwork] = useState("");
  const [generatedIPs, setGeneratedIPs] = useState([]);
  const [totalSubnets, setTotalSubnets] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [infoDialogVisible, setInfoDialogVisible] = useState(false);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const isValidClassC = (value) => {
    const num = parseInt(value);
    return num >= 192 && num <= 223;
  };

  const handleInputChange = (index, value) => {
    if (index < 4) {
      // Pour les octets de l'adresse IP
      const newValue = value.replace(/[^0-9]/g, "");
      if (newValue === "") {
        const newIp = [...ipAddress];
        newIp[index] = newValue;
        setIpAddress(newIp);
      } else {
        const num = parseInt(newValue);
        // Validation spéciale pour le premier octet (classe C)
        if (index === 0) {
          if (num >= 0 && num <= 223) {
            // Permet la saisie mais avec feedback visuel
            const newIp = [...ipAddress];
            newIp[index] = newValue;
            setIpAddress(newIp);
            if (newValue.length === 3) {
              inputRefs[index + 1].current?.focus();
            }
          }
        } else if (num >= 0 && num <= 255) {
          const newIp = [...ipAddress];
          newIp[index] = newValue;
          setIpAddress(newIp);
          if (newValue.length === 3 && index < 3) {
            inputRefs[index + 1].current?.focus();
          }
        }
      }
    } else {
      // Pour le masque
      const newValue = value.replace(/[^0-9]/g, "");
      if (
        newValue === "" ||
        (parseInt(newValue) >= 0 && parseInt(newValue) <= 32)
      ) {
        setMask(newValue);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !ipAddress[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === ".") {
      e.preventDefault();
      if (index < 4) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const generateIPByUsers = (oct1, oct2, oct3, oct4, users) => {
    const results = [];
    let currentOct4 = 0;
    const increment = Math.pow(2, Math.ceil(Math.log2(parseInt(users) + 2)));
    const bites = Math.log2(increment);
    const subnet = 32 - bites;

    for (let i = 0; i < Math.floor(256 / increment); i++) {
      if (currentOct4 < 256) {
        results.push(`${oct1}.${oct2}.${oct3}.${currentOct4}/${subnet}`);
        currentOct4 += increment;
      }
    }
    return results;
  };

  const generateIPByNetworks = (oct1, oct2, oct3, oct4, networks) => {
    const results = [];

    if (!Number.isInteger(networks) || networks <= 0 || networks > 256) {
      console.error("Valeur 'networks' invalide :", networks);
      return results;
    }

    const bits = Math.ceil(Math.log2(networks));
    const n_networks = Math.pow(2, bits);

    const increment = Math.pow(2, 8 - bits);

    const IP_Subnet_local = 24 + bits;

    let currentOct4 = 0;
    for (let i = 0; i < n_networks; i++) {
      if (currentOct4 < 256) {
        results.push(
          `${oct1}.${oct2}.${oct3}.${currentOct4}/${IP_Subnet_local}`
        );
        currentOct4 += increment;
      }
    }
    return results;
  };

  const generateIPBySubnet = (oct1, oct2, oct3, oct4, subnet) => {
    const results = [];
    let currentOct4 = 0;
    const increment = Math.pow(2, 8 - (subnet % 8));
    const n_networks = 256 / increment;

    for (let i = 0; i < n_networks; i++) {
      if (currentOct4 < 256) {
        results.push(`${oct1}.${oct2}.${oct3}.${currentOct4}/${subnet}`);
        currentOct4 += increment;
      }
    }
    return results;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const oct1 = parseInt(ipAddress[0]);
    const oct2 = parseInt(ipAddress[1]);
    const oct3 = parseInt(ipAddress[2]);
    const oct4 = parseInt(ipAddress[3]);
    const subnet = parseInt(mask);

    let results = [];

    if (subnet && subnet > 23) {
      results = generateIPBySubnet(oct1, oct2, oct3, oct4, subnet);
    } else if (subNetwork && !isNaN(parseInt(subNetwork))) {
      results = generateIPByNetworks(
        oct1,
        oct2,
        oct3,
        oct4,
        parseInt(subNetwork)
      );
    } else if (user && !isNaN(parseInt(user))) {
      results = generateIPByUsers(oct1, oct2, oct3, oct4, parseInt(user));
    }

    setGeneratedIPs(results);
    setTotalSubnets(results.length);
    setDialogVisible(true);
  };

  const renderIPInputs = (ip) => {
    const [address, mask] = ip.split("/");
    const octets = address.split(".");

    return (
      <div className="flex align-items-center gap-2 ip-row">
        {octets.map((octet, index) => (
          <>
            <InputText
              key={index}
              value={octet}
              className="ip-input"
              disabled
            />
            {index < 3 && <span>.</span>}
          </>
        ))}
        <span>/</span>
        <InputText value={mask} className="ip-input" disabled />
      </div>
    );
  };

  return (
    <>
      <div className="container">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-column align-items-center gap-4 p-4">
            <div className="flex align-items-center gap-2" id="ip">
              {ipAddress.map((octet, index) => (
                <>
                  <span className="p-input-icon-right">
                    <InputText
                      key={index}
                      ref={inputRefs[index]}
                      value={octet}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`ip-input ${
                        index === 0 && octet && !isValidClassC(octet)
                          ? "p-invalid"
                          : ""
                      }`}
                      maxLength={3}
                      placeholder={index === 0 ? "192" : "000"}
                      tooltip={
                        index === 0
                          ? "Doit être entre 192 et 223 (Classe C)"
                          : undefined
                      }
                      tooltipOptions={{ event: "focus" }}
                    />
                    {index === 0 && octet && !isValidClassC(octet) && (
                      <i className="pi pi-exclamation-circle text-red-500" />
                    )}
                  </span>
                  {index < 3 && <span>.</span>}
                </>
              ))}
              <span>/</span>
              <InputText
                ref={inputRefs[4]}
                value={mask}
                onChange={(e) => handleInputChange(4, e.target.value)}
                className="ip-input"
                maxLength={2}
                placeholder="24"
              />
            </div>
            <div className="flex align-items-center gap-4 users">
              <span className="p-float-label">
                <InputText
                  id="user"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-12rem"
                />
                <label htmlFor="user">Utilisateur</label>
              </span>
              <span className="p-float-label">
                <InputText
                  id="subNetwork"
                  value={subNetwork}
                  onChange={(e) => setSubNetwork(e.target.value)}
                  className="w-12rem"
                />
                <label htmlFor="subNetwork">Sous-réseau</label>
              </span>
            </div>
            <div className="flex align-items-center gap-2 actions">
              <Button
                type="submit"
                label="Générer"
                className="w-10rem"
                disabled={
                  ipAddress.some((octet) => !octet) ||
                  !isValidClassC(ipAddress[0])
                }
                tooltip={
                  !isValidClassC(ipAddress[0])
                    ? "L'adresse IP doit être de classe C (premier octet entre 192 et 223)"
                    : undefined
                }
              />
              <Button
                type="button"
                icon="pi pi-info-circle"
                onClick={() => setInfoDialogVisible(true)}
                className="p-button-rounded p-button-info p-button-text"
                tooltip="Priorités de calcul"
              />
            </div>
          </div>
        </form>

        <Dialog
          header="Priorités de calcul des sous-réseaux"
          visible={infoDialogVisible}
          onHide={() => setInfoDialogVisible(false)}
          style={{ width: "40vw" }}
          breakpoints={{ "960px": "75vw", "641px": "100vw" }}
        >
          <div className="flex flex-column gap-3">
            <div className="flex flex-column gap-2">
              <h3 className="m-0">Ordre de priorité :</h3>
              <ol className="m-0 pl-4">
                <li className="mb-2">
                  <strong>Masque de sous-réseau :</strong> Si un masque
                  supérieur à 23 est fourni, il sera utilisé en priorité
                </li>
                <li className="mb-2">
                  <strong>Nombre de sous-réseaux :</strong> Si aucun masque
                  n'est fourni mais qu'un nombre de sous-réseaux est spécifié
                </li>
                <li className="mb-2">
                  <strong>Nombre d'utilisateurs :</strong> Si seul le nombre
                  d'utilisateurs est spécifié
                </li>
              </ol>
            </div>
            <div className="flex flex-column gap-2">
              <h3 className="m-0">Calcul par type :</h3>
              <ul className="m-0 pl-4">
                <li className="mb-2">
                  <strong>Par masque :</strong> Divise le réseau selon le masque
                  CIDR spécifié
                </li>
                <li className="mb-2">
                  <strong>Par sous-réseaux :</strong> Calcule le masque optimal
                  pour obtenir le nombre exact de sous-réseaux demandé
                </li>
                <li className="mb-2">
                  <strong>Par utilisateurs :</strong> Calcule le masque optimal
                  pour que chaque sous-réseau puisse accueillir le nombre
                  d'utilisateurs + 2 (réseau et broadcast)
                </li>
              </ul>
            </div>
          </div>
        </Dialog>

        <Dialog
          header={`Adresses IP générées — ${totalSubnets} sous-réseau${
            totalSubnets > 1 ? "s" : ""
          }`}
          visible={dialogVisible}
          onHide={() => setDialogVisible(false)}
          style={{ width: "50vw" }}
          breakpoints={{ "960px": "75vw", "641px": "100vw" }}
        >
          <div className="flex flex-column gap-2">
            <div className="text-sm text-600">
              Total : {totalSubnets} sous-réseau{totalSubnets > 1 ? "s" : ""}
            </div>
            {generatedIPs.map((ip, index) => (
              <div key={index} className="p-3 surface-ground border-round">
                {renderIPInputs(ip)}
              </div>
            ))}
          </div>
        </Dialog>
      </div>
    </>
  );
}

export default App;
