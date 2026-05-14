import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Spinner from '@/components/common/Spinner/Spinner';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import useCamera from '@/hooks/useCamera';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { SEVERITY_LIST } from '@/constants/severityLevels';
import { createDisaster } from '@/services/api';
import { classNames } from '@/utils/formatters';
import { shrinkDataUrl } from '@/utils/image';
import { DISASTER_TITLE_MAX, DISASTER_DESCRIPTION_MAX } from '@/constants/formLimits';
import styles from './Report.module.css';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Tableau de bord', icon: '◆', end: true },
  { to: ROUTES.ALERTS, label: 'Alertes', icon: '!' },
  { to: ROUTES.MAP, label: 'Carte', icon: '◉' },
  { to: ROUTES.REPORT, label: 'Signaler', icon: '+' },
  { to: ROUTES.PROFILE, label: 'Mon profil', icon: '·' },
];

const TITLE_MAX = DISASTER_TITLE_MAX;
const DESC_MAX = DISASTER_DESCRIPTION_MAX;

export default function Report() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const camera = useCamera({ facingMode: 'environment' });
  const fallbackInputId = useId();

  const [type, setType] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formRef = useRef(null);

  // When the camera is denied/unsupported the user falls back to a file picker.
  function onFallbackFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') camera.setExternalPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    const next = {};
    if (!type) next.type = 'Choisissez un type de catastrophe.';
    if (!zoneId) next.zone = 'Choisissez un quartier.';
    if (!severity) next.severity = 'Choisissez un niveau de gravité.';
    const t = title.trim();
    if (t.length < 4) next.title = 'Le titre doit contenir au moins 4 caractères.';
    else if (t.length > TITLE_MAX) next.title = `${TITLE_MAX} caractères maximum.`;
    const d = description.trim();
    if (d.length < 10) next.description = 'Décrivez la situation (au moins 10 caractères).';
    else if (d.length > DESC_MAX) next.description = `${DESC_MAX} caractères maximum.`;
    if (!camera.photoDataUrl) next.photo = 'Une photo est requise.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) {
      setFormError('Vérifiez les champs en rouge avant d\'envoyer.');
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSubmitting(true);
    try {
      const photoDataUrl = await shrinkDataUrl(camera.photoDataUrl, {
        maxWidth: 1280,
        quality: 0.75,
      });
      await createDisaster({
        type,
        quartierId: zoneId,
        severity,
        title: title.trim(),
        description: description.trim(),
        address: address.trim() || null,
        photoDataUrl,
      });
      camera.reset();
      notify({
        tone: 'success',
        title: 'Signalement envoyé',
        body: "Un administrateur va l'examiner. Merci pour votre vigilance.",
      });
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setFormError(err?.message || "Échec de l'envoi. Réessayez.");
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow="Nouveau signalement"
      title="Signaler une catastrophe"
      tone="user"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>
          Prenez une photo, indiquez votre quartier et décrivez la situation.
          Un administrateur valide votre signalement, généralement en moins de 24 h.
        </p>
      </section>

      <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
        {/* Étape 1 — Photo */}
        <section className={styles.panel} aria-labelledby="step-photo-title">
          <header className={styles.panelHead}>
            <h2 id="step-photo-title" className={styles.panelTitle}>
              Étape 1 — Capture photo
            </h2>
            <span className={styles.panelHint}>Obligatoire</span>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.cameraStage} aria-live="polite">
              {camera.status === 'streaming' && (
                <video
                  ref={camera.videoRef}
                  className={styles.video}
                  autoPlay
                  playsInline
                  muted
                />
              )}
              {camera.status === 'captured' && camera.photoDataUrl && (
                <img
                  src={camera.photoDataUrl}
                  alt="Aperçu de la photo capturée"
                  className={styles.preview}
                />
              )}
              {(camera.status === 'idle' || camera.status === 'requesting') && (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderGlyph} aria-hidden="true">◉</span>
                  <span>
                    {camera.status === 'requesting'
                      ? 'Demande d\'autorisation…'
                      : 'Caméra inactive'}
                  </span>
                </div>
              )}
              {(camera.status === 'denied' || camera.status === 'error') && (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderGlyph} aria-hidden="true">⚠</span>
                  <span>Caméra inaccessible</span>
                </div>
              )}
              {camera.status === 'unsupported' && (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderGlyph} aria-hidden="true">📷</span>
                  <span>Caméra non supportée — utilisez le fichier ci-dessous</span>
                </div>
              )}
              <canvas ref={camera.canvasRef} className={styles.canvas} aria-hidden="true" />
            </div>

            {/* Camera controls */}
            <div className={styles.cameraActions}>
              {camera.status === 'idle' && (
                <Button type="button" variant="primary" onClick={camera.start}>
                  Activer la caméra
                </Button>
              )}
              {camera.status === 'requesting' && (
                <span className={styles.requesting}>
                  <Spinner size={18} /> Initialisation…
                </span>
              )}
              {camera.status === 'streaming' && (
                <>
                  <Button type="button" variant="primary" onClick={camera.capture}>
                    Prendre la photo
                  </Button>
                  <Button type="button" variant="ghost" onClick={camera.reset}>
                    Annuler
                  </Button>
                </>
              )}
              {camera.status === 'captured' && (
                <Button type="button" variant="outline" onClick={camera.retake}>
                  Reprendre la photo
                </Button>
              )}
              {(camera.status === 'denied' || camera.status === 'error') && (
                <Button type="button" variant="primary" onClick={camera.start}>
                  Réessayer
                </Button>
              )}
            </div>

            {(camera.status === 'denied' ||
              camera.status === 'error' ||
              camera.status === 'unsupported') && (
              <div className={styles.permError} role="alert">
                <p className={styles.permErrorEyebrow}>Accès caméra</p>
                <p className={styles.permErrorBody}>
                  {camera.error ||
                    "La caméra n'est pas disponible. Importez plutôt une image depuis votre appareil."}
                </p>
                <label htmlFor={fallbackInputId} className={styles.fallbackLabel}>
                  Choisir une image
                </label>
                <input
                  id={fallbackInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFallbackFile}
                  className={styles.fallbackInput}
                />
              </div>
            )}

            {errors.photo && (
              <p className={styles.fieldError} role="alert">
                {errors.photo}
              </p>
            )}
          </div>
        </section>

        {/* Étape 2 — Détails */}
        <section className={styles.panel} aria-labelledby="step-details-title">
          <header className={styles.panelHead}>
            <h2 id="step-details-title" className={styles.panelTitle}>
              Étape 2 — Détails
            </h2>
            <span className={styles.panelHint}>Tout sauf adresse est requis</span>
          </header>

          <div className={styles.panelBody}>
            {/* Type de catastrophe */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldLabel}>Type de catastrophe</legend>
              <div
                className={styles.pillGrid}
                role="radiogroup"
                aria-label="Type de catastrophe"
              >
                {DISASTER_TYPE_LIST.map((t) => {
                  const selected = type === t.id;
                  return (
                    <label
                      key={t.id}
                      className={classNames(styles.pill, selected && styles.pillSelected)}
                    >
                      <input
                        type="radio"
                        name="disasterType"
                        value={t.id}
                        checked={selected}
                        onChange={() => setType(t.id)}
                        className={styles.pillInput}
                      />
                      <span className={styles.pillTitle}>{t.label}</span>
                      <span className={styles.pillDesc}>{t.description}</span>
                    </label>
                  );
                })}
              </div>
              {errors.type && (
                <p className={styles.fieldError} role="alert">
                  {errors.type}
                </p>
              )}
            </fieldset>

            {/* Quartier */}
            <div className={styles.field}>
              <label htmlFor="zoneSelect" className={styles.fieldLabel}>
                Quartier concerné
              </label>
              <select
                id="zoneSelect"
                className={classNames(styles.select, errors.zone && styles.selectError)}
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              >
                <option value="">— Sélectionnez un quartier —</option>
                {DOUALA_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {z.arrondissement}
                  </option>
                ))}
              </select>
              {errors.zone && (
                <p className={styles.fieldError} role="alert">
                  {errors.zone}
                </p>
              )}
            </div>

            {/* Sévérité */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldLabel}>Niveau de gravité</legend>
              <div
                className={styles.severityGrid}
                role="radiogroup"
                aria-label="Niveau de gravité"
              >
                {SEVERITY_LIST.map((s) => {
                  const selected = severity === s.id;
                  return (
                    <label
                      key={s.id}
                      className={classNames(
                        styles.severityPill,
                        selected && styles.severityPillSelected,
                      )}
                      style={selected ? { background: s.color, borderColor: s.color } : undefined}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={s.id}
                        checked={selected}
                        onChange={() => setSeverity(s.id)}
                        className={styles.pillInput}
                      />
                      <span>{s.label}</span>
                    </label>
                  );
                })}
              </div>
              {errors.severity && (
                <p className={styles.fieldError} role="alert">
                  {errors.severity}
                </p>
              )}
            </fieldset>

            {/* Titre */}
            <Input
              label="Titre court"
              placeholder="Ex. Inondation rue Alfred Saker"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
              error={errors.title}
              maxLength={TITLE_MAX}
            />

            {/* Description */}
            <div className={classNames(styles.field, errors.description && styles.fieldErrored)}>
              <label htmlFor="descTextarea" className={styles.fieldLabel}>
                Description de la situation
              </label>
              <textarea
                id="descTextarea"
                className={styles.textarea}
                placeholder="Décrivez précisément ce que vous observez : ampleur, victimes éventuelles, conditions d'accès…"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                rows={6}
              />
              <div className={styles.counterRow}>
                {errors.description ? (
                  <p className={styles.fieldError} role="alert">
                    {errors.description}
                  </p>
                ) : (
                  <span className={styles.counterHint}>
                    Précisez la zone exacte et la situation observée.
                  </span>
                )}
                <span className={styles.counter}>
                  {description.length} / {DESC_MAX}
                </span>
              </div>
            </div>

            {/* Adresse */}
            <Input
              label="Adresse / point de repère (facultatif)"
              placeholder="Ex. Carrefour Total Bonabéri"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              hint="Aide les secours à localiser plus précisément l'événement."
            />
          </div>
        </section>

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.submitRow}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size={18} /> Envoi en cours…
              </>
            ) : (
              <>Envoyer le signalement →</>
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
