# Dokploy CLI Commands

Generated from `Dokploy/cli` source files.

## admin

- `dokploy admin setup-monitoring` - admin setupMonitoring

## ai

- `dokploy ai create` - ai create
- `dokploy ai delete` - ai delete
- `dokploy ai deploy` - ai deploy
- `dokploy ai get` - ai get
- `dokploy ai get-all` - ai getAll
- `dokploy ai get-models` - ai getModels
- `dokploy ai one` - ai one
- `dokploy ai suggest` - ai suggest
- `dokploy ai update` - ai update

## application

- `dokploy application cancel-deployment` - application cancelDeployment
- `dokploy application clean-queues` - application cleanQueues
- `dokploy application clear-deployments` - application clearDeployments
- `dokploy application create` - application create
- `dokploy application delete` - application delete
- `dokploy application deploy` - application deploy
- `dokploy application disconnect-git-provider` - application disconnectGitProvider
- `dokploy application kill-build` - application killBuild
- `dokploy application mark-running` - application markRunning
- `dokploy application move` - application move
- `dokploy application one` - application one
- `dokploy application read-app-monitoring` - application readAppMonitoring
- `dokploy application read-traefik-config` - application readTraefikConfig
- `dokploy application redeploy` - application redeploy
- `dokploy application refresh-token` - application refreshToken
- `dokploy application reload` - application reload
- `dokploy application save-bitbucket-provider` - application saveBitbucketProvider
- `dokploy application save-build-type` - application saveBuildType
- `dokploy application save-docker-provider` - application saveDockerProvider
- `dokploy application save-environment` - application saveEnvironment
- `dokploy application save-git-provider` - application saveGitProvider
- `dokploy application save-gitea-provider` - application saveGiteaProvider
- `dokploy application save-github-provider` - application saveGithubProvider
- `dokploy application save-gitlab-provider` - application saveGitlabProvider
- `dokploy application search` - application search
- `dokploy application start` - application start
- `dokploy application stop` - application stop
- `dokploy application update` - application update
- `dokploy application update-traefik-config` - application updateTraefikConfig

## auth

- `dokploy auth` - Authenticate with your Dokploy server

## backup

- `dokploy backup create` - backup create
- `dokploy backup list-backup-files` - backup listBackupFiles
- `dokploy backup manual-backup-compose` - backup manualBackupCompose
- `dokploy backup manual-backup-mariadb` - backup manualBackupMariadb
- `dokploy backup manual-backup-mongo` - backup manualBackupMongo
- `dokploy backup manual-backup-my-sql` - backup manualBackupMySql
- `dokploy backup manual-backup-postgres` - backup manualBackupPostgres
- `dokploy backup manual-backup-web-server` - backup manualBackupWebServer
- `dokploy backup one` - backup one
- `dokploy backup remove` - backup remove
- `dokploy backup update` - backup update

## bitbucket

- `dokploy bitbucket bitbucket-providers` - bitbucket bitbucketProviders
- `dokploy bitbucket create` - bitbucket create
- `dokploy bitbucket get-bitbucket-branches` - bitbucket getBitbucketBranches
- `dokploy bitbucket get-bitbucket-repositories` - bitbucket getBitbucketRepositories
- `dokploy bitbucket one` - bitbucket one
- `dokploy bitbucket test-connection` - bitbucket testConnection
- `dokploy bitbucket update` - bitbucket update

## certificates

- `dokploy certificates all` - certificates all
- `dokploy certificates create` - certificates create
- `dokploy certificates one` - certificates one
- `dokploy certificates remove` - certificates remove

## cluster

- `dokploy cluster add-manager` - cluster addManager
- `dokploy cluster add-worker` - cluster addWorker
- `dokploy cluster get-nodes` - cluster getNodes
- `dokploy cluster remove-worker` - cluster removeWorker

## compose

- `dokploy compose cancel-deployment` - compose cancelDeployment
- `dokploy compose clean-queues` - compose cleanQueues
- `dokploy compose clear-deployments` - compose clearDeployments
- `dokploy compose create` - compose create
- `dokploy compose delete` - compose delete
- `dokploy compose deploy` - compose deploy
- `dokploy compose deploy-template` - compose deployTemplate
- `dokploy compose disconnect-git-provider` - compose disconnectGitProvider
- `dokploy compose fetch-source-type` - compose fetchSourceType
- `dokploy compose get-converted-compose` - compose getConvertedCompose
- `dokploy compose get-default-command` - compose getDefaultCommand
- `dokploy compose get-tags` - compose getTags
- `dokploy compose import` - compose import
- `dokploy compose isolated-deployment` - compose isolatedDeployment
- `dokploy compose kill-build` - compose killBuild
- `dokploy compose load-mounts-by-service` - compose loadMountsByService
- `dokploy compose load-services` - compose loadServices
- `dokploy compose move` - compose move
- `dokploy compose one` - compose one
- `dokploy compose process-template` - compose processTemplate
- `dokploy compose randomize-compose` - compose randomizeCompose
- `dokploy compose redeploy` - compose redeploy
- `dokploy compose refresh-token` - compose refreshToken
- `dokploy compose search` - compose search
- `dokploy compose start` - compose start
- `dokploy compose stop` - compose stop
- `dokploy compose templates` - compose templates
- `dokploy compose update` - compose update

## deployment

- `dokploy deployment all` - deployment all
- `dokploy deployment all-by-compose` - deployment allByCompose
- `dokploy deployment all-by-server` - deployment allByServer
- `dokploy deployment all-by-type` - deployment allByType
- `dokploy deployment all-centralized` - deployment allCentralized
- `dokploy deployment kill-process` - deployment killProcess
- `dokploy deployment queue-list` - deployment queueList
- `dokploy deployment remove-deployment` - deployment removeDeployment

## destination

- `dokploy destination all` - destination all
- `dokploy destination create` - destination create
- `dokploy destination one` - destination one
- `dokploy destination remove` - destination remove
- `dokploy destination test-connection` - destination testConnection
- `dokploy destination update` - destination update

## docker

- `dokploy docker get-config` - docker getConfig
- `dokploy docker get-containers` - docker getContainers
- `dokploy docker get-containers-by-app-label` - docker getContainersByAppLabel
- `dokploy docker get-containers-by-app-name-match` - docker getContainersByAppNameMatch
- `dokploy docker get-service-containers-by-app-name` - docker getServiceContainersByAppName
- `dokploy docker get-stack-containers-by-app-name` - docker getStackContainersByAppName
- `dokploy docker restart-container` - docker restartContainer

## domain

- `dokploy domain by-application-id` - domain byApplicationId
- `dokploy domain by-compose-id` - domain byComposeId
- `dokploy domain can-generate-traefik-me-domains` - domain canGenerateTraefikMeDomains
- `dokploy domain create` - domain create
- `dokploy domain delete` - domain delete
- `dokploy domain generate-domain` - domain generateDomain
- `dokploy domain one` - domain one
- `dokploy domain update` - domain update
- `dokploy domain validate-domain` - domain validateDomain

## environment

- `dokploy environment by-project-id` - environment byProjectId
- `dokploy environment create` - environment create
- `dokploy environment duplicate` - environment duplicate
- `dokploy environment one` - environment one
- `dokploy environment remove` - environment remove
- `dokploy environment search` - environment search
- `dokploy environment update` - environment update

## git-provider

- `dokploy git-provider get-all` - gitProvider getAll
- `dokploy git-provider remove` - gitProvider remove

## gitea

- `dokploy gitea create` - gitea create
- `dokploy gitea get-gitea-branches` - gitea getGiteaBranches
- `dokploy gitea get-gitea-repositories` - gitea getGiteaRepositories
- `dokploy gitea get-gitea-url` - gitea getGiteaUrl
- `dokploy gitea gitea-providers` - gitea giteaProviders
- `dokploy gitea one` - gitea one
- `dokploy gitea test-connection` - gitea testConnection
- `dokploy gitea update` - gitea update

## github

- `dokploy github get-github-branches` - github getGithubBranches
- `dokploy github get-github-repositories` - github getGithubRepositories
- `dokploy github github-providers` - github githubProviders
- `dokploy github one` - github one
- `dokploy github test-connection` - github testConnection
- `dokploy github update` - github update

## gitlab

- `dokploy gitlab create` - gitlab create
- `dokploy gitlab get-gitlab-branches` - gitlab getGitlabBranches
- `dokploy gitlab get-gitlab-repositories` - gitlab getGitlabRepositories
- `dokploy gitlab gitlab-providers` - gitlab gitlabProviders
- `dokploy gitlab one` - gitlab one
- `dokploy gitlab test-connection` - gitlab testConnection
- `dokploy gitlab update` - gitlab update

## license-key

- `dokploy license-key activate` - licenseKey activate
- `dokploy license-key deactivate` - licenseKey deactivate
- `dokploy license-key get-enterprise-settings` - licenseKey getEnterpriseSettings
- `dokploy license-key have-valid-license-key` - licenseKey haveValidLicenseKey
- `dokploy license-key update-enterprise-settings` - licenseKey updateEnterpriseSettings
- `dokploy license-key validate` - licenseKey validate

## mariadb

- `dokploy mariadb change-status` - mariadb changeStatus
- `dokploy mariadb create` - mariadb create
- `dokploy mariadb deploy` - mariadb deploy
- `dokploy mariadb move` - mariadb move
- `dokploy mariadb one` - mariadb one
- `dokploy mariadb rebuild` - mariadb rebuild
- `dokploy mariadb reload` - mariadb reload
- `dokploy mariadb remove` - mariadb remove
- `dokploy mariadb save-environment` - mariadb saveEnvironment
- `dokploy mariadb save-external-port` - mariadb saveExternalPort
- `dokploy mariadb search` - mariadb search
- `dokploy mariadb start` - mariadb start
- `dokploy mariadb stop` - mariadb stop
- `dokploy mariadb update` - mariadb update

## mongo

- `dokploy mongo change-status` - mongo changeStatus
- `dokploy mongo create` - mongo create
- `dokploy mongo deploy` - mongo deploy
- `dokploy mongo move` - mongo move
- `dokploy mongo one` - mongo one
- `dokploy mongo rebuild` - mongo rebuild
- `dokploy mongo reload` - mongo reload
- `dokploy mongo remove` - mongo remove
- `dokploy mongo save-environment` - mongo saveEnvironment
- `dokploy mongo save-external-port` - mongo saveExternalPort
- `dokploy mongo search` - mongo search
- `dokploy mongo start` - mongo start
- `dokploy mongo stop` - mongo stop
- `dokploy mongo update` - mongo update

## mounts

- `dokploy mounts all-named-by-application-id` - mounts allNamedByApplicationId
- `dokploy mounts create` - mounts create
- `dokploy mounts list-by-service-id` - mounts listByServiceId
- `dokploy mounts one` - mounts one
- `dokploy mounts remove` - mounts remove
- `dokploy mounts update` - mounts update

## mysql

- `dokploy mysql change-status` - mysql changeStatus
- `dokploy mysql create` - mysql create
- `dokploy mysql deploy` - mysql deploy
- `dokploy mysql move` - mysql move
- `dokploy mysql one` - mysql one
- `dokploy mysql rebuild` - mysql rebuild
- `dokploy mysql reload` - mysql reload
- `dokploy mysql remove` - mysql remove
- `dokploy mysql save-environment` - mysql saveEnvironment
- `dokploy mysql save-external-port` - mysql saveExternalPort
- `dokploy mysql search` - mysql search
- `dokploy mysql start` - mysql start
- `dokploy mysql stop` - mysql stop
- `dokploy mysql update` - mysql update

## notification

- `dokploy notification all` - notification all
- `dokploy notification create-custom` - notification createCustom
- `dokploy notification create-discord` - notification createDiscord
- `dokploy notification create-email` - notification createEmail
- `dokploy notification create-gotify` - notification createGotify
- `dokploy notification create-lark` - notification createLark
- `dokploy notification create-ntfy` - notification createNtfy
- `dokploy notification create-pushover` - notification createPushover
- `dokploy notification create-resend` - notification createResend
- `dokploy notification create-slack` - notification createSlack
- `dokploy notification create-teams` - notification createTeams
- `dokploy notification create-telegram` - notification createTelegram
- `dokploy notification get-email-providers` - notification getEmailProviders
- `dokploy notification one` - notification one
- `dokploy notification receive-notification` - notification receiveNotification
- `dokploy notification remove` - notification remove
- `dokploy notification test-custom-connection` - notification testCustomConnection
- `dokploy notification test-discord-connection` - notification testDiscordConnection
- `dokploy notification test-email-connection` - notification testEmailConnection
- `dokploy notification test-gotify-connection` - notification testGotifyConnection
- `dokploy notification test-lark-connection` - notification testLarkConnection
- `dokploy notification test-ntfy-connection` - notification testNtfyConnection
- `dokploy notification test-pushover-connection` - notification testPushoverConnection
- `dokploy notification test-resend-connection` - notification testResendConnection
- `dokploy notification test-slack-connection` - notification testSlackConnection
- `dokploy notification test-teams-connection` - notification testTeamsConnection
- `dokploy notification test-telegram-connection` - notification testTelegramConnection
- `dokploy notification update-custom` - notification updateCustom
- `dokploy notification update-discord` - notification updateDiscord
- `dokploy notification update-email` - notification updateEmail
- `dokploy notification update-gotify` - notification updateGotify
- `dokploy notification update-lark` - notification updateLark
- `dokploy notification update-ntfy` - notification updateNtfy
- `dokploy notification update-pushover` - notification updatePushover
- `dokploy notification update-resend` - notification updateResend
- `dokploy notification update-slack` - notification updateSlack
- `dokploy notification update-teams` - notification updateTeams
- `dokploy notification update-telegram` - notification updateTelegram

## organization

- `dokploy organization active` - organization active
- `dokploy organization all` - organization all
- `dokploy organization all-invitations` - organization allInvitations
- `dokploy organization create` - organization create
- `dokploy organization delete` - organization delete
- `dokploy organization one` - organization one
- `dokploy organization remove-invitation` - organization removeInvitation
- `dokploy organization set-default` - organization setDefault
- `dokploy organization update` - organization update
- `dokploy organization update-member-role` - organization updateMemberRole

## patch

- `dokploy patch by-entity-id` - patch byEntityId
- `dokploy patch clean-patch-repos` - patch cleanPatchRepos
- `dokploy patch create` - patch create
- `dokploy patch delete` - patch delete
- `dokploy patch ensure-repo` - patch ensureRepo
- `dokploy patch mark-file-for-deletion` - patch markFileForDeletion
- `dokploy patch one` - patch one
- `dokploy patch read-repo-directories` - patch readRepoDirectories
- `dokploy patch read-repo-file` - patch readRepoFile
- `dokploy patch save-file-as-patch` - patch saveFileAsPatch
- `dokploy patch toggle-enabled` - patch toggleEnabled
- `dokploy patch update` - patch update

## port

- `dokploy port create` - port create
- `dokploy port delete` - port delete
- `dokploy port one` - port one
- `dokploy port update` - port update

## postgres

- `dokploy postgres change-status` - postgres changeStatus
- `dokploy postgres create` - postgres create
- `dokploy postgres deploy` - postgres deploy
- `dokploy postgres move` - postgres move
- `dokploy postgres one` - postgres one
- `dokploy postgres rebuild` - postgres rebuild
- `dokploy postgres reload` - postgres reload
- `dokploy postgres remove` - postgres remove
- `dokploy postgres save-environment` - postgres saveEnvironment
- `dokploy postgres save-external-port` - postgres saveExternalPort
- `dokploy postgres search` - postgres search
- `dokploy postgres start` - postgres start
- `dokploy postgres stop` - postgres stop
- `dokploy postgres update` - postgres update

## preview-deployment

- `dokploy preview-deployment all` - previewDeployment all
- `dokploy preview-deployment delete` - previewDeployment delete
- `dokploy preview-deployment one` - previewDeployment one
- `dokploy preview-deployment redeploy` - previewDeployment redeploy

## project

- `dokploy project all` - project all
- `dokploy project all-for-permissions` - project allForPermissions
- `dokploy project create` - project create
- `dokploy project duplicate` - project duplicate
- `dokploy project one` - project one
- `dokploy project remove` - project remove
- `dokploy project search` - project search
- `dokploy project update` - project update

## redirects

- `dokploy redirects create` - redirects create
- `dokploy redirects delete` - redirects delete
- `dokploy redirects one` - redirects one
- `dokploy redirects update` - redirects update

## redis

- `dokploy redis change-status` - redis changeStatus
- `dokploy redis create` - redis create
- `dokploy redis deploy` - redis deploy
- `dokploy redis move` - redis move
- `dokploy redis one` - redis one
- `dokploy redis rebuild` - redis rebuild
- `dokploy redis reload` - redis reload
- `dokploy redis remove` - redis remove
- `dokploy redis save-environment` - redis saveEnvironment
- `dokploy redis save-external-port` - redis saveExternalPort
- `dokploy redis search` - redis search
- `dokploy redis start` - redis start
- `dokploy redis stop` - redis stop
- `dokploy redis update` - redis update

## registry

- `dokploy registry all` - registry all
- `dokploy registry create` - registry create
- `dokploy registry one` - registry one
- `dokploy registry remove` - registry remove
- `dokploy registry test-registry` - registry testRegistry
- `dokploy registry test-registry-by-id` - registry testRegistryById
- `dokploy registry update` - registry update

## rollback

- `dokploy rollback delete` - rollback delete
- `dokploy rollback rollback` - rollback rollback

## schedule

- `dokploy schedule create` - schedule create
- `dokploy schedule delete` - schedule delete
- `dokploy schedule list` - schedule list
- `dokploy schedule one` - schedule one
- `dokploy schedule run-manually` - schedule runManually
- `dokploy schedule update` - schedule update

## security

- `dokploy security create` - security create
- `dokploy security delete` - security delete
- `dokploy security one` - security one
- `dokploy security update` - security update

## server

- `dokploy server all` - server all
- `dokploy server build-servers` - server buildServers
- `dokploy server count` - server count
- `dokploy server create` - server create
- `dokploy server get-default-command` - server getDefaultCommand
- `dokploy server get-server-metrics` - server getServerMetrics
- `dokploy server get-server-time` - server getServerTime
- `dokploy server one` - server one
- `dokploy server public-ip` - server publicIp
- `dokploy server remove` - server remove
- `dokploy server security` - server security
- `dokploy server setup` - server setup
- `dokploy server setup-monitoring` - server setupMonitoring
- `dokploy server update` - server update
- `dokploy server validate` - server validate
- `dokploy server with-sshkey` - server withSSHKey

## settings

- `dokploy settings assign-domain-server` - settings assignDomainServer
- `dokploy settings check-gpustatus` - settings checkGPUStatus
- `dokploy settings clean-all` - settings cleanAll
- `dokploy settings clean-all-deployment-queue` - settings cleanAllDeploymentQueue
- `dokploy settings clean-docker-builder` - settings cleanDockerBuilder
- `dokploy settings clean-docker-prune` - settings cleanDockerPrune
- `dokploy settings clean-monitoring` - settings cleanMonitoring
- `dokploy settings clean-redis` - settings cleanRedis
- `dokploy settings clean-sshprivate-key` - settings cleanSSHPrivateKey
- `dokploy settings clean-stopped-containers` - settings cleanStoppedContainers
- `dokploy settings clean-unused-images` - settings cleanUnusedImages
- `dokploy settings clean-unused-volumes` - settings cleanUnusedVolumes
- `dokploy settings get-dokploy-cloud-ips` - settings getDokployCloudIps
- `dokploy settings get-dokploy-version` - settings getDokployVersion
- `dokploy settings get-ip` - settings getIp
- `dokploy settings get-log-cleanup-status` - settings getLogCleanupStatus
- `dokploy settings get-open-api-document` - settings getOpenApiDocument
- `dokploy settings get-release-tag` - settings getReleaseTag
- `dokploy settings get-traefik-ports` - settings getTraefikPorts
- `dokploy settings get-update-data` - settings getUpdateData
- `dokploy settings get-web-server-settings` - settings getWebServerSettings
- `dokploy settings have-activate-requests` - settings haveActivateRequests
- `dokploy settings have-traefik-dashboard-port-enabled` - settings haveTraefikDashboardPortEnabled
- `dokploy settings health` - settings health
- `dokploy settings is-cloud` - settings isCloud
- `dokploy settings is-user-subscribed` - settings isUserSubscribed
- `dokploy settings read-directories` - settings readDirectories
- `dokploy settings read-middleware-traefik-config` - settings readMiddlewareTraefikConfig
- `dokploy settings read-traefik-config` - settings readTraefikConfig
- `dokploy settings read-traefik-env` - settings readTraefikEnv
- `dokploy settings read-traefik-file` - settings readTraefikFile
- `dokploy settings read-web-server-traefik-config` - settings readWebServerTraefikConfig
- `dokploy settings reload-redis` - settings reloadRedis
- `dokploy settings reload-server` - settings reloadServer
- `dokploy settings reload-traefik` - settings reloadTraefik
- `dokploy settings save-sshprivate-key` - settings saveSSHPrivateKey
- `dokploy settings setup-gpu` - settings setupGPU
- `dokploy settings toggle-dashboard` - settings toggleDashboard
- `dokploy settings toggle-requests` - settings toggleRequests
- `dokploy settings update-docker-cleanup` - settings updateDockerCleanup
- `dokploy settings update-log-cleanup` - settings updateLogCleanup
- `dokploy settings update-middleware-traefik-config` - settings updateMiddlewareTraefikConfig
- `dokploy settings update-server` - settings updateServer
- `dokploy settings update-server-ip` - settings updateServerIp
- `dokploy settings update-traefik-config` - settings updateTraefikConfig
- `dokploy settings update-traefik-file` - settings updateTraefikFile
- `dokploy settings update-traefik-ports` - settings updateTraefikPorts
- `dokploy settings update-web-server-traefik-config` - settings updateWebServerTraefikConfig
- `dokploy settings write-traefik-env` - settings writeTraefikEnv

## ssh-key

- `dokploy ssh-key all` - sshKey all
- `dokploy ssh-key create` - sshKey create
- `dokploy ssh-key generate` - sshKey generate
- `dokploy ssh-key one` - sshKey one
- `dokploy ssh-key remove` - sshKey remove
- `dokploy ssh-key update` - sshKey update

## sso

- `dokploy sso add-trusted-origin` - sso addTrustedOrigin
- `dokploy sso delete-provider` - sso deleteProvider
- `dokploy sso get-trusted-origins` - sso getTrustedOrigins
- `dokploy sso list-providers` - sso listProviders
- `dokploy sso one` - sso one
- `dokploy sso register` - sso register
- `dokploy sso remove-trusted-origin` - sso removeTrustedOrigin
- `dokploy sso show-sign-in-with-sso` - sso showSignInWithSSO
- `dokploy sso update` - sso update
- `dokploy sso update-trusted-origin` - sso updateTrustedOrigin

## stripe

- `dokploy stripe can-create-more-servers` - stripe canCreateMoreServers
- `dokploy stripe create-checkout-session` - stripe createCheckoutSession
- `dokploy stripe create-customer-portal-session` - stripe createCustomerPortalSession
- `dokploy stripe get-current-plan` - stripe getCurrentPlan
- `dokploy stripe get-invoices` - stripe getInvoices
- `dokploy stripe get-products` - stripe getProducts
- `dokploy stripe upgrade-subscription` - stripe upgradeSubscription

## swarm

- `dokploy swarm get-node-apps` - swarm getNodeApps
- `dokploy swarm get-node-info` - swarm getNodeInfo
- `dokploy swarm get-nodes` - swarm getNodes

## user

- `dokploy user all` - user all
- `dokploy user assign-permissions` - user assignPermissions
- `dokploy user check-user-organizations` - user checkUserOrganizations
- `dokploy user create-api-key` - user createApiKey
- `dokploy user delete-api-key` - user deleteApiKey
- `dokploy user generate-token` - user generateToken
- `dokploy user get` - user get
- `dokploy user get-backups` - user getBackups
- `dokploy user get-container-metrics` - user getContainerMetrics
- `dokploy user get-invitations` - user getInvitations
- `dokploy user get-metrics-token` - user getMetricsToken
- `dokploy user get-server-metrics` - user getServerMetrics
- `dokploy user get-user-by-token` - user getUserByToken
- `dokploy user have-root-access` - user haveRootAccess
- `dokploy user one` - user one
- `dokploy user remove` - user remove
- `dokploy user send-invitation` - user sendInvitation
- `dokploy user update` - user update

## volume-backups

- `dokploy volume-backups create` - volumeBackups create
- `dokploy volume-backups delete` - volumeBackups delete
- `dokploy volume-backups list` - volumeBackups list
- `dokploy volume-backups one` - volumeBackups one
- `dokploy volume-backups run-manually` - volumeBackups runManually
- `dokploy volume-backups update` - volumeBackups update

