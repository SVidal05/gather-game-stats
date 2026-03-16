import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "es" | "en" | "fr";

const LANG_KEY = "gamenight_language";

const translations = {
  // Header
  "app.title": { es: "GameNight", en: "GameNight", fr: "GameNight" },
  "app.tracker": { es: "Tracker", en: "Tracker", fr: "Tracker" },

  // Tabs
  "tab.home": { es: "Inicio", en: "Home", fr: "Accueil" },
  "tab.players": { es: "Jugadores", en: "Players", fr: "Joueurs" },
  "tab.sessions": { es: "Sesiones", en: "Sessions", fr: "Sessions" },
  "tab.games": { es: "Juegos", en: "Games", fr: "Jeux" },
  "tab.ranking": { es: "Ranking", en: "Ranking", fr: "Classement" },
  "tab.charts": { es: "Gráficas", en: "Charts", fr: "Graphiques" },
  "tab.profile": { es: "Perfil", en: "Profile", fr: "Profil" },

  // Dashboard
  "dashboard.title": { es: "Panel", en: "Dashboard", fr: "Tableau de bord" },
  "dashboard.subtitle": { es: "Estadísticas de tu grupo", en: "Your group's game night stats", fr: "Statistiques de votre groupe" },
  "dashboard.sessions": { es: "Sesiones", en: "Sessions", fr: "Sessions" },
  "dashboard.players": { es: "Jugadores", en: "Players", fr: "Joueurs" },
  "dashboard.games": { es: "Juegos", en: "Games", fr: "Jeux" },
  "dashboard.topWinner": { es: "Top Ganador", en: "Top Winner", fr: "Meilleur" },
  "dashboard.currentLeader": { es: "Líder Actual", en: "Current Leader", fr: "Leader Actuel" },
  "dashboard.wins": { es: "victorias", en: "wins", fr: "victoires" },
  "dashboard.winRate": { es: "tasa de victoria", en: "win rate", fr: "taux de victoire" },
  "dashboard.recentSessions": { es: "Sesiones Recientes", en: "Recent Sessions", fr: "Sessions Récentes" },
  "dashboard.welcome": { es: "¡Bienvenido a GameNight!", en: "Welcome to GameNight!", fr: "Bienvenue sur GameNight !" },
  "dashboard.welcomeMsg": { es: "Empieza agregando jugadores, luego crea tu primera sesión.", en: "Start by adding players, then create your first session.", fr: "Commencez par ajouter des joueurs, puis créez votre première session." },

  // Players
  "players.title": { es: "Jugadores", en: "Players", fr: "Joueurs" },
  "players.player": { es: "jugador", en: "player", fr: "joueur" },
  "players.players": { es: "jugadores", en: "players", fr: "joueurs" },
  "players.add": { es: "Añadir", en: "Add", fr: "Ajouter" },
  "players.newPlayer": { es: "Nuevo Jugador", en: "New Player", fr: "Nouveau Joueur" },
  "players.name": { es: "Nombre", en: "Name", fr: "Nom" },
  "players.playerName": { es: "Nombre del jugador", en: "Player name", fr: "Nom du joueur" },
  "players.avatar": { es: "Avatar", en: "Avatar", fr: "Avatar" },
  "players.color": { es: "Color", en: "Color", fr: "Couleur" },
  "players.addPlayer": { es: "Añadir Jugador", en: "Add Player", fr: "Ajouter Joueur" },
  "players.duplicateNameWarning": { es: "Ya existe un jugador con este nombre en el grupo", en: "A player with this name already exists in this group", fr: "Un joueur avec ce nom existe déjà dans ce groupe" },
  "players.save": { es: "Guardar", en: "Save", fr: "Sauvegarder" },
  "players.games": { es: "partidas", en: "games", fr: "parties" },
  "players.wins": { es: "victorias", en: "wins", fr: "victoires" },
  "players.pts": { es: "pts", en: "pts", fr: "pts" },
  "players.noPlayers": { es: "Aún no hay jugadores. ¡Agrega el primero!", en: "No players yet. Add your first player!", fr: "Pas encore de joueurs. Ajoutez le premier !" },
  "players.mostWins": { es: "👑 Más Victorias", en: "👑 Most Wins", fr: "👑 Plus de Victoires" },
  "players.onFire": { es: "🔥 En Racha", en: "🔥 On Fire", fr: "🔥 En Feu" },
  "players.veteran": { es: "🎖️ Veterano", en: "🎖️ Veteran", fr: "🎖️ Vétéran" },
  "players.topScorer": { es: "💎 Máximo Anotador", en: "💎 Top Scorer", fr: "💎 Meilleur Scoreur" },
  "players.linked": { es: "Jugador vinculado a tu cuenta", en: "Player linked to your account", fr: "Joueur lié à votre compte" },
  "players.unlinked": { es: "Jugador desvinculado de tu cuenta", en: "Player unlinked from your account", fr: "Joueur délié de votre compte" },
  "players.noUserLinked": { es: "Sin usuario", en: "No user linked", fr: "Aucun utilisateur" },
  "players.unlinkMe": { es: "Desvincular de mi cuenta", en: "Unlink from my account", fr: "Délier de mon compte" },
  "players.linkMe": { es: "Vincular a mi cuenta", en: "Link to my account", fr: "Lier à mon compte" },

  // Sessions
  "sessions.title": { es: "Sesiones", en: "Sessions", fr: "Sessions" },
  "sessions.session": { es: "sesión", en: "session", fr: "session" },
  "sessions.sessionPlural": { es: "sesiones", en: "sessions", fr: "sessions" },
  "sessions.new": { es: "Nueva", en: "New", fr: "Nouvelle" },
  "sessions.newSession": { es: "Nueva Sesión", en: "New Session", fr: "Nouvelle Session" },
  "sessions.editSession": { es: "Editar Sesión", en: "Edit Session", fr: "Modifier Session" },
  "sessions.sessionName": { es: "Nombre de la Sesión", en: "Session Name", fr: "Nom de la Session" },
  "sessions.sessionNamePlaceholder": { es: "Noche de viernes épica", en: "Friday Night Showdown", fr: "Soirée du vendredi" },
  "sessions.game": { es: "Juego", en: "Game", fr: "Jeu" },
  "sessions.selectGame": { es: "Selecciona un juego", en: "Select a game", fr: "Sélectionnez un jeu" },
  "sessions.customGame": { es: "O escribe un juego personalizado", en: "Or type a custom game", fr: "Ou tapez un jeu personnalisé" },
  "sessions.date": { es: "Fecha", en: "Date", fr: "Date" },
  "sessions.players": { es: "Jugadores", en: "Players", fr: "Joueurs" },
  "sessions.scores": { es: "Puntuaciones", en: "Scores", fr: "Scores" },
  "sessions.score": { es: "Puntuación", en: "Score", fr: "Score" },
  "sessions.winner": { es: "Ganador", en: "Winner", fr: "Gagnant" },
  "sessions.selectWinner": { es: "Seleccionar ganador", en: "Select winner", fr: "Sélectionner le gagnant" },
  "sessions.notes": { es: "Notas (opcional)", en: "Notes (optional)", fr: "Notes (optionnel)" },
  "sessions.notesPlaceholder": { es: "¿Algún momento memorable?", en: "Any memorable moments?", fr: "Des moments mémorables ?" },
  "sessions.record": { es: "🎉 Registrar Sesión", en: "🎉 Record Session", fr: "🎉 Enregistrer Session" },
  "sessions.saveChanges": { es: "💾 Guardar Cambios", en: "💾 Save Changes", fr: "💾 Sauvegarder" },
  "sessions.stats": { es: "Stats", en: "Stats", fr: "Stats" },
  "sessions.optional": { es: "(opcional)", en: "(optional)", fr: "(optionnel)" },
  "sessions.result": { es: "Resultado", en: "Result", fr: "Résultat" },
  "sessions.gameStats": { es: "Stats del Juego", en: "Game Stats", fr: "Stats du Jeu" },
  "sessions.minPlayers": { es: "Agrega al menos 2 jugadores para crear una sesión.", en: "Add at least 2 players to create a session.", fr: "Ajoutez au moins 2 joueurs pour créer une session." },
  "sessions.noSessions": { es: "Aún no hay sesiones. ¡Empieza una noche de juegos!", en: "No sessions yet. Start a game night!", fr: "Pas encore de sessions. Commencez une soirée jeux !" },
  "sessions.advancedStats": { es: "Estadísticas Avanzadas", en: "Advanced Statistics", fr: "Statistiques Avancées" },
  "sessions.addCustomStat": { es: "Añadir Stat Personalizado", en: "Add Custom Stat", fr: "Ajouter Stat Personnalisé" },

  // Play (merged games + sessions)
  "play.title": { es: "Jugar", en: "Play", fr: "Jouer" },
  "play.subtitle": { es: "Elige un juego y empieza una sesión", en: "Pick a game and start a session", fr: "Choisissez un jeu et commencez" },
  "play.history": { es: "Historial", en: "History", fr: "Historique" },
  "play.newGame": { es: "Nueva", en: "New", fr: "Nouvelle" },
  "play.play": { es: "Jugar", en: "Play", fr: "Jouer" },

  // Solo mode
  "solo.gameMode": { es: "Modo de juego", en: "Game mode", fr: "Mode de jeu" },
  "solo.modeMultiplayer": { es: "Multijugador", en: "Multiplayer", fr: "Multijoueur" },
  "solo.modeSolo": { es: "Solo", en: "Solo", fr: "Solo" },
  "solo.playerLabel": { es: "Jugador", en: "Player", fr: "Joueur" },
  "solo.selectPlayerHint": { es: "Selecciona un jugador para esta sesión solo", en: "Select one player for this solo session", fr: "Sélectionnez un joueur pour cette session solo" },
  "solo.sessionTag": { es: "Solo", en: "Solo", fr: "Solo" },
  "solo.personalSession": { es: "Sesión personal", en: "Personal session", fr: "Session personnelle" },

  // Games
  "games.title": { es: "Juegos", en: "Games", fr: "Jeux" },
  "games.subtitle": { es: "Explora estadísticas por juego", en: "Explore stats by game type", fr: "Explorez les stats par jeu" },
  "games.yourGames": { es: "Tus Juegos", en: "Your Games", fr: "Vos Jeux" },
  "games.discoverMore": { es: "Descubre Más", en: "Discover More", fr: "Découvrir Plus" },
  "games.popularGames": { es: "Juegos Populares", en: "Popular Games", fr: "Jeux Populaires" },
  "games.noSessions": { es: "¡Juega partidas para ver estadísticas aquí!", en: "Play some games to see detailed stats here!", fr: "Jouez pour voir les stats ici !" },
  "games.trackStats": { es: "Trackea Estas Stats", en: "Track These Stats", fr: "Suivez Ces Stats" },
  "games.winDistribution": { es: "Distribución de Victorias", en: "Win Distribution", fr: "Distribution des Victoires" },
  "games.avgScore": { es: "Puntuación Media", en: "Average Score", fr: "Score Moyen" },
  "games.playerComparison": { es: "Comparación de Jugadores", en: "Player Comparison", fr: "Comparaison des Joueurs" },
  "games.scoreHistory": { es: "Historial de Puntos", en: "Score History", fr: "Historique des Scores" },
  "games.customStats": { es: "Stats Personalizadas", en: "Custom Stats", fr: "Stats Personnalisées" },
  "games.leaderboard": { es: "Tabla de Líderes", en: "Leaderboard", fr: "Classement" },
  "games.sessionHistory": { es: "Historial de Sesiones", en: "Session History", fr: "Historique des Sessions" },
  "games.noSessionsYet": { es: "Aún no hay sesiones para", en: "No sessions for", fr: "Pas encore de sessions pour" },
  "games.createSession": { es: "¡Crea una sesión para ver gráficas!", en: "Create a session to see charts!", fr: "Créez une session pour voir les graphiques !" },

  // Ranking
  "ranking.title": { es: "Ranking", en: "Ranking", fr: "Classement" },
  "ranking.subtitle": { es: "Tabla de líderes global", en: "Leaderboard across all games", fr: "Classement global" },
  "ranking.noRanking": { es: "¡Juega partidas para ver el ranking!", en: "Play some games to see rankings!", fr: "Jouez pour voir le classement !" },
  "ranking.player": { es: "Jugador", en: "Player", fr: "Joueur" },
  "ranking.games": { es: "Partidas", en: "Games", fr: "Parties" },
  "ranking.wins": { es: "Victorias", en: "Wins", fr: "Victoires" },

  // Charts
  "charts.title": { es: "Gráficas", en: "Charts", fr: "Graphiques" },
  "charts.subtitle": { es: "Estadísticas visuales", en: "Visual statistics", fr: "Statistiques visuelles" },
  "charts.noCharts": { es: "¡Juega partidas para ver gráficas!", en: "Play some games to see charts!", fr: "Jouez pour voir les graphiques !" },
  "charts.allGames": { es: "Todos los Juegos", en: "All Games", fr: "Tous les Jeux" },
  "charts.winsPerPlayer": { es: "Victorias por Jugador", en: "Wins per Player", fr: "Victoires par Joueur" },
  "charts.sessionsOverTime": { es: "Sesiones en el Tiempo", en: "Sessions Over Time", fr: "Sessions dans le Temps" },
  "charts.totalPoints": { es: "Puntos Totales", en: "Total Points", fr: "Points Totaux" },

  // Profile
  "profile.title": { es: "Perfil", en: "Profile", fr: "Profil" },
  "profile.settings": { es: "Configuración", en: "Settings", fr: "Paramètres" },
  "profile.language": { es: "Idioma", en: "Language", fr: "Langue" },
  "profile.theme": { es: "Tema", en: "Theme", fr: "Thème" },
  "profile.light": { es: "Claro", en: "Light", fr: "Clair" },
  "profile.dark": { es: "Oscuro", en: "Dark", fr: "Sombre" },
  "profile.achievements": { es: "Logros", en: "Achievements", fr: "Succès" },
  "profile.stats": { es: "Estadísticas Generales", en: "General Stats", fr: "Statistiques Générales" },
  "profile.totalSessions": { es: "Total de Sesiones", en: "Total Sessions", fr: "Total Sessions" },
  "profile.totalPlayers": { es: "Total de Jugadores", en: "Total Players", fr: "Total Joueurs" },
  "profile.totalGames": { es: "Juegos Diferentes", en: "Different Games", fr: "Jeux Différents" },
  "profile.unlocked": { es: "desbloqueado", en: "unlocked", fr: "débloqué" },
  "profile.locked": { es: "bloqueado", en: "locked", fr: "verrouillé" },

  // Radar stats
  "stat.wins": { es: "Victorias", en: "Wins", fr: "Victoires" },
  "stat.games": { es: "Partidas", en: "Games", fr: "Parties" },
  "stat.points": { es: "Puntos", en: "Points", fr: "Points" },
  "stat.winRate": { es: "Tasa Victoria", en: "Win Rate", fr: "Taux Victoire" },
  "stat.avgScore": { es: "Puntuación Media", en: "Avg Score", fr: "Score Moyen" },

  // Chart tabs
  "chart.wins": { es: "Victorias", en: "Wins", fr: "Victoires" },
  "chart.avg": { es: "Media", en: "Avg", fr: "Moy." },
  "chart.radar": { es: "Radar", en: "Radar", fr: "Radar" },
  "chart.history": { es: "Historial", en: "History", fr: "Historique" },
  "chart.stats": { es: "Stats", en: "Stats", fr: "Stats" },
  "chart.advanced": { es: "Avanzado", en: "Advanced", fr: "Avancé" },
  "chart.advancedTitle": { es: "Estadísticas Avanzadas por Jugador", en: "Advanced Stats by Player", fr: "Statistiques Avancées par Joueur" },
  "chart.total": { es: "Total", en: "Total", fr: "Total" },
  "common.loading": { es: "Cargando...", en: "Loading...", fr: "Chargement..." },

  // Common
  "common.noWinnersYet": { es: "Aún no hay ganadores registrados", en: "No winners recorded yet", fr: "Aucun gagnant enregistré" },
  "common.radarTooMany": { es: "El radar funciona mejor con ≤6 jugadores", en: "Radar works best with ≤6 players", fr: "Le radar fonctionne mieux avec ≤6 joueurs" },
  "common.playMore": { es: "Juega más para ver radar", en: "Play more to see radar charts", fr: "Jouez plus pour voir les radars" },
  "common.recordSessions": { es: "Registra sesiones para ver el historial", en: "Record sessions to see score history", fr: "Enregistrez des sessions pour voir l'historique" },

  // Auth
  "auth.loginSubtitle": { es: "Inicia sesión para continuar", en: "Sign in to continue", fr: "Connectez-vous pour continuer" },
  "auth.signupSubtitle": { es: "Crea tu cuenta gratuita", en: "Create your free account", fr: "Créez votre compte gratuit" },
  "auth.resetSubtitle": { es: "Te enviaremos un enlace para restablecer tu contraseña", en: "We'll send you a password reset link", fr: "Nous vous enverrons un lien de réinitialisation" },
  "auth.email": { es: "Email", en: "Email", fr: "Email" },
  "auth.password": { es: "Contraseña", en: "Password", fr: "Mot de passe" },
  "auth.signIn": { es: "Iniciar Sesión", en: "Sign In", fr: "Se Connecter" },
  "auth.signUp": { es: "Registrarse", en: "Sign Up", fr: "S'inscrire" },
  "auth.logout": { es: "Cerrar Sesión", en: "Log Out", fr: "Déconnexion" },
  "auth.forgotPassword": { es: "¿Olvidaste tu contraseña?", en: "Forgot your password?", fr: "Mot de passe oublié ?" },
  "auth.noAccount": { es: "¿No tienes cuenta?", en: "Don't have an account?", fr: "Pas de compte ?" },
  "auth.hasAccount": { es: "¿Ya tienes cuenta?", en: "Already have an account?", fr: "Déjà un compte ?" },
  "auth.backToLogin": { es: "Volver al inicio de sesión", en: "Back to login", fr: "Retour à la connexion" },
  "auth.sendReset": { es: "Enviar Enlace", en: "Send Reset Link", fr: "Envoyer le Lien" },
  "auth.resetSent": { es: "Enlace enviado", en: "Link sent", fr: "Lien envoyé" },
  "auth.resetSentMsg": { es: "Revisa tu correo para restablecer tu contraseña", en: "Check your email to reset your password", fr: "Vérifiez votre email pour réinitialiser votre mot de passe" },
  "auth.signupSuccess": { es: "¡Cuenta creada!", en: "Account created!", fr: "Compte créé !" },
  "auth.signupSuccessMsg": { es: "Revisa tu correo para confirmar tu cuenta", en: "Check your email to confirm your account", fr: "Vérifiez votre email pour confirmer votre compte" },
  "auth.passwordUpdated": { es: "Contraseña actualizada", en: "Password updated", fr: "Mot de passe mis à jour" },
  "auth.invalidResetLink": { es: "Enlace de restablecimiento inválido", en: "Invalid reset link", fr: "Lien de réinitialisation invalide" },
  "auth.newPassword": { es: "Nueva Contraseña", en: "New Password", fr: "Nouveau Mot de Passe" },
  "auth.newPasswordPlaceholder": { es: "Tu nueva contraseña", en: "Your new password", fr: "Votre nouveau mot de passe" },
  "auth.updatePassword": { es: "Actualizar Contraseña", en: "Update Password", fr: "Mettre à Jour" },
  "auth.username": { es: "Nombre de usuario", en: "Username", fr: "Nom d'utilisateur" },
  "auth.orWith": { es: "o con", en: "or with", fr: "ou avec" },

  // Settings
  "settings.title": { es: "Configuración", en: "Settings", fr: "Paramètres" },
  "settings.subtitle": { es: "Personaliza tu experiencia", en: "Customize your experience", fr: "Personnalisez votre expérience" },
  "settings.account": { es: "Cuenta", en: "Account", fr: "Compte" },
  "settings.edit": { es: "Editar", en: "Edit", fr: "Modifier" },
  "settings.usernameSaved": { es: "Nombre de usuario actualizado", en: "Username updated", fr: "Nom d'utilisateur mis à jour" },

  // Groups
  "groups.title": { es: "Mis Grupos", en: "My Groups", fr: "Mes Groupes" },
  "groups.subtitle": { es: "Grupos de amigos para jugar", en: "Friend groups to play together", fr: "Groupes d'amis pour jouer" },
  "groups.createFirst": { es: "Crea tu primer grupo", en: "Create your first group", fr: "Créez votre premier groupe" },
  "groups.createFirstMsg": { es: "Crea un grupo e invita a tus amigos para empezar a trackear partidas juntos.", en: "Create a group and invite friends to start tracking games together.", fr: "Créez un groupe et invitez vos amis pour suivre vos parties ensemble." },
  "groups.createGroup": { es: "Crear Grupo", en: "Create Group", fr: "Créer Groupe" },
  "groups.joinGroup": { es: "Unirse a Grupo", en: "Join Group", fr: "Rejoindre" },
  "groups.groupName": { es: "Nombre del grupo", en: "Group name", fr: "Nom du groupe" },
  "groups.groupNamePlaceholder": { es: "Ej: Noches de viernes", en: "E.g. Friday Nights", fr: "Ex: Soirées du vendredi" },
  "groups.inviteCode": { es: "Código de invitación", en: "Invite code", fr: "Code d'invitation" },
  "groups.inviteCodePlaceholder": { es: "Pega el código aquí", en: "Paste the code here", fr: "Collez le code ici" },
  "groups.join": { es: "Unirse", en: "Join", fr: "Rejoindre" },
  "groups.members": { es: "Miembros", en: "Members", fr: "Membres" },
  "groups.admin": { es: "Admin", en: "Admin", fr: "Admin" },
  "groups.member": { es: "Miembro", en: "Member", fr: "Membre" },
  "groups.invite": { es: "Invitar", en: "Invite", fr: "Inviter" },
  "groups.inviteByEmail": { es: "Invitar por email", en: "Invite by email", fr: "Inviter par email" },
  "groups.inviteLink": { es: "Enlace de invitación", en: "Invite link", fr: "Lien d'invitation" },
  "groups.copyCode": { es: "Copiar código", en: "Copy code", fr: "Copier le code" },
  "groups.copied": { es: "¡Copiado!", en: "Copied!", fr: "Copié !" },
  "groups.emailPlaceholder": { es: "Email del amigo", en: "Friend's email", fr: "Email de l'ami" },
  "groups.sendInvite": { es: "Enviar Invitación", en: "Send Invite", fr: "Envoyer" },
  "groups.inviteSent": { es: "Invitación enviada", en: "Invite sent", fr: "Invitation envoyée" },
  "groups.pendingInvites": { es: "Invitaciones pendientes", en: "Pending invites", fr: "Invitations en attente" },
  "groups.acceptInvite": { es: "Aceptar", en: "Accept", fr: "Accepter" },
  "groups.declineInvite": { es: "Rechazar", en: "Decline", fr: "Refuser" },
  "groups.leaveGroup": { es: "Salir del grupo", en: "Leave group", fr: "Quitter le groupe" },
  "groups.deleteGroup": { es: "Eliminar grupo", en: "Delete group", fr: "Supprimer le groupe" },
  "groups.editName": { es: "Editar nombre", en: "Edit name", fr: "Modifier le nom" },
  "groups.removeMember": { es: "Expulsar", en: "Remove", fr: "Expulser" },
  "groups.switchGroup": { es: "Cambiar grupo", en: "Switch group", fr: "Changer de groupe" },
  "groups.noMembers": { es: "Sin miembros aún", en: "No members yet", fr: "Pas encore de membres" },
  "groups.owner": { es: "Propietario", en: "Owner", fr: "Propriétaire" },
  "groups.you": { es: "(tú)", en: "(you)", fr: "(vous)" },
  "groups.invalidCode": { es: "Código inválido", en: "Invalid code", fr: "Code invalide" },
  "groups.joined": { es: "¡Te has unido al grupo!", en: "You joined the group!", fr: "Vous avez rejoint le groupe !" },
  "groups.manage": { es: "Gestionar", en: "Manage", fr: "Gérer" },
  "groups.personalWorkspace": { es: "Espacio personal", en: "Personal Workspace", fr: "Espace personnel" },
  "groups.personalWorkspaceHint": { es: "Este espacio privado está optimizado para seguimiento en solitario y no se puede eliminar.", en: "This private workspace is optimized for solo tracking and cannot be deleted.", fr: "Cet espace privé est optimisé pour le suivi en solo et ne peut pas être supprimé." },
  "groups.personalLabel": { es: "Personal", en: "Personal", fr: "Personnel" },
  "groups.soloTag": { es: "Solo", en: "Solo", fr: "Solo" },

  // Onboarding Tutorial
  "onboarding.stepOf": { es: "Paso {current} de {total}", en: "Step {current} of {total}", fr: "Étape {current} sur {total}" },
  "onboarding.skip": { es: "Omitir", en: "Skip", fr: "Passer" },
  "onboarding.prev": { es: "Anterior", en: "Back", fr: "Précédent" },
  "onboarding.next": { es: "Siguiente", en: "Next", fr: "Suivant" },
  "onboarding.finish": { es: "¡Listo!", en: "Done!", fr: "Terminé !" },
  "onboarding.step1Title": { es: "Crea un Grupo", en: "Create a Group", fr: "Créer un Groupe" },
  "onboarding.step1Desc": { es: "Los grupos organizan tus noches de juegos. Crea uno para ti y tus amigos, o usa el grupo Personal para jugar en solitario.", en: "Groups organize your game nights. Create one for you and your friends, or use the Personal group for solo play.", fr: "Les groupes organisent vos soirées jeux. Créez-en un pour vous et vos amis, ou utilisez le groupe Personnel pour jouer en solo." },
  "onboarding.step2Title": { es: "Añade Jugadores", en: "Add Players", fr: "Ajouter des Joueurs" },
  "onboarding.step2Desc": { es: "Los jugadores representan a los participantes en tus partidas. Añade a tus amigos con un nombre, avatar y color único.", en: "Players represent participants in your matches. Add your friends with a name, avatar, and unique color.", fr: "Les joueurs représentent les participants à vos parties. Ajoutez vos amis avec un nom, un avatar et une couleur unique." },
  "onboarding.step3Title": { es: "Registra tu Primera Partida", en: "Record Your First Session", fr: "Enregistrez Votre Première Partie" },
  "onboarding.step3Desc": { es: "Selecciona un juego del catálogo, elige los jugadores, registra puntuaciones y corona al ganador. ¡Así de fácil!", en: "Select a game from the catalog, choose players, record scores, and crown the winner. It's that easy!", fr: "Sélectionnez un jeu du catalogue, choisissez les joueurs, enregistrez les scores et couronnez le gagnant. C'est aussi simple que ça !" },
  "onboarding.step4Title": { es: "Vista General", en: "Overview", fr: "Vue d'ensemble" },
  "onboarding.step4Desc": { es: "Aquí encontrarás un resumen de la actividad de tu grupo: estadísticas clave, el juego más popular, el mejor jugador y un historial de partidas recientes.", en: "Here you'll find a summary of your group's activity: key stats, the most popular game, the top player, and a history of recent sessions.", fr: "Ici vous trouverez un résumé de l'activité de votre groupe : statistiques clés, le jeu le plus populaire, le meilleur joueur et un historique des parties récentes." },
  "onboarding.step5Title": { es: "Tabla de Clasificación", en: "Leaderboard", fr: "Classement" },
  "onboarding.step5Desc": { es: "Los rankings se actualizan automáticamente con cada partida. Compite por el primer puesto y sigue la evolución de todos los jugadores.", en: "Rankings update automatically with every match. Compete for first place and track every player's progress.", fr: "Les classements se mettent à jour automatiquement à chaque partie. Compétez pour la première place et suivez la progression de chaque joueur." },
  "onboarding.step6Title": { es: "Logros y Medallas", en: "Achievements & Badges", fr: "Succès et Badges" },
  "onboarding.step6Desc": { es: "Los logros se desbloquean automáticamente mientras juegas. Acumula victorias, rachas y hitos para ganar medallas especiales.", en: "Achievements unlock automatically as you play. Accumulate wins, streaks, and milestones to earn special badges.", fr: "Les succès se débloquent automatiquement en jouant. Accumulez des victoires, des séries et des jalons pour gagner des badges spéciaux." },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "es",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && ["es", "en", "fr"].includes(saved)) return saved as Language;
    } catch {}
    return "es";
  });

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const setLang = (l: Language) => setLangState(l);

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry["en"] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
];
