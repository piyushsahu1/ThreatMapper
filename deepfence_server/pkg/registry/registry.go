package registry

import (
	"encoding/json"

	"github.com/deepfence/ThreatMapper/deepfence_server/model"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/constants"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/acr"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/dockerhub"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/dockerprivate"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/ecr"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/gcr"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/harbor"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/jfrog"
	"github.com/deepfence/ThreatMapper/deepfence_server/pkg/registry/quay"
	"github.com/deepfence/golang_deepfence_sdk/utils/encryption"
	postgresql_db "github.com/deepfence/golang_deepfence_sdk/utils/postgresql/postgresql-db"
	"github.com/pkg/errors"
)

// todo: try interface in input not return
func GetRegistry(rType string, requestByte []byte) (Registry, error) {
	var r Registry
	err := errors.Errorf("registry type: %s, not supported", rType)

	switch rType {
	case constants.DOCKER_HUB:
		r, err = dockerhub.New(requestByte)
	case constants.QUAY:
		r, err = quay.New(requestByte)
	case constants.GCR:
		r, err = gcr.New(requestByte)
	case constants.ACR:
		r, err = acr.New(requestByte)
	case constants.DOCKER_PRIVATE:
		r, err = dockerprivate.New(requestByte)
	case constants.HARBOR:
		r, err = harbor.New(requestByte)
	case constants.JFROG:
		r, err = jfrog.New(requestByte)
	case constants.ECR:
		r, err = ecr.New(requestByte)
	}

	return r, err
}

func GetRegistryWithRegistryRow(row postgresql_db.GetContainerRegistriesRow) (Registry, error) {
	var r Registry
	err := errors.Errorf("registry type: %s, not supported", row.RegistryType)

	switch row.RegistryType {
	case constants.DOCKER_HUB:
		var nonSecret map[string]string
		var secret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		r = &dockerhub.RegistryDockerHub{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: dockerhub.NonSecret{
				DockerHubNamespace: nonSecret["docker_hub_namespace"],
				DockerHubUsername:  nonSecret["docker_hub_username"],
			},
			Secret: dockerhub.Secret{
				DockerHubPassword: secret["docker_hub_password"],
			},
		}
		return r, nil
	case constants.QUAY:
		var nonSecret map[string]string
		var secret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		r = &quay.RegistryQuay{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: quay.NonSecret{
				QuayNamespace:   nonSecret["quay_namespace"],
				QuayRegistryURL: nonSecret["quay_registry_url"],
			},
			Secret: quay.Secret{
				QuayAccessToken: secret["quay_access_token"],
			},
		}
		return r, nil
	case constants.GCR:
		var nonSecret map[string]string
		var secret map[string]string
		var extras map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.Extras, &extras)
		if err != nil {
			return nil, err
		}
		r = &gcr.RegistryGCR{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: gcr.NonSecret{
				RegistryURL: nonSecret["registry_url"],
				ProjectId:   nonSecret["project_id"],
			},
			Secret: gcr.Secret{
				ProjectId:    secret["project_id"],
				PrivateKeyId: secret["private_key_id"],
			},
			Extras: gcr.Extras{
				ServiceAccountJson: extras["service_account_json"],
			},
		}
		return r, nil
	case constants.ACR:
		var nonSecret map[string]string
		var secret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		r = &acr.RegistryACR{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: acr.NonSecret{
				AzureRegistryURL:      nonSecret["azure_registry_url"],
				AzureRegistryUsername: nonSecret["azure_registry_username"],
			},
			Secret: acr.Secret{
				AzureRegistryPassword: secret["azure_registry_password"],
			},
		}
		return r, nil
	case constants.DOCKER_PRIVATE:
		var nonSecret map[string]string
		var secret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		r = &dockerprivate.RegistryDockerPrivate{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: dockerprivate.NonSecret{
				DockerRegistryURL: nonSecret["docker_registry_url"],
				DockerUsername:    nonSecret["docker_username"],
			},
			Secret: dockerprivate.Secret{
				DockerPassword: secret["docker_password"],
			},
		}
		return r, nil
	case constants.HARBOR:
		var nonSecret map[string]string
		var secret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		r = &harbor.RegistryHarbor{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: harbor.NonSecret{
				HarborRegistryURL: nonSecret["harbor_registry_url"],
				HarborUsername:    nonSecret["harbor_username"],
				HarborProjectName: nonSecret["harbor_project_name"],
			},
			Secret: harbor.Secret{
				HarborPassword: secret["harbor_password"],
			},
		}
		return r, nil
	case constants.JFROG:
		var nonSecret map[string]string
		var secret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		r = &jfrog.RegistryJfrog{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: jfrog.NonSecret{
				JfrogRegistryURL: nonSecret["jfrog_registry_url"],
				JfrogRepository:  nonSecret["jfrog_repository"],
				JfrogUsername:    nonSecret["jfrog_username"],
			},
			Secret: jfrog.Secret{
				JfrogPassword: secret["jfrog_password"],
			},
		}
		return r, nil

	case constants.ECR:
		var nonSecret map[string]string
		var secret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal(row.EncryptedSecret, &secret)
		if err != nil {
			return nil, err
		}
		r = &ecr.RegistryECR{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: ecr.NonSecret{
				UseIAMRole:           nonSecret["use_iam_role"],
				IsPublic:             nonSecret["is_public"],
				AWSAccessKeyID:       nonSecret["aws_access_key_id"],
				AWSRegionName:        nonSecret["aws_region_name"],
				AWSAccountID:         nonSecret["aws_account_id"],
				TargetAccountRoleARN: nonSecret["target_account_role_arn"],
			},
			Secret: ecr.Secret{
				AWSSecretAccessKey: secret["aws_secret_access_key"],
			},
		}
		return r, err
	}
	return r, err
}

func GetRegistryWithRegistrySafeRow(row postgresql_db.GetContainerRegistriesSafeRow) (Registry, error) {
	var r Registry
	err := errors.Errorf("registry type: %s, not supported", row.RegistryType)

	switch row.RegistryType {
	case constants.DOCKER_HUB:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &dockerhub.RegistryDockerHub{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: dockerhub.NonSecret{
				DockerHubNamespace: nonSecret["docker_hub_namespace"],
				DockerHubUsername:  nonSecret["docker_hub_username"],
			},
		}
		return r, nil
	case constants.QUAY:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &quay.RegistryQuay{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: quay.NonSecret{
				QuayNamespace:   nonSecret["quay_namespace"],
				QuayRegistryURL: nonSecret["quay_registry_url"],
			},
		}
		return r, nil
	case constants.GCR:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &gcr.RegistryGCR{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: gcr.NonSecret{
				RegistryURL: nonSecret["registry_url"],
				ProjectId:   nonSecret["project_id"],
			},
		}
		return r, nil
	case constants.ACR:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &acr.RegistryACR{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: acr.NonSecret{
				AzureRegistryURL:      nonSecret["azure_registry_url"],
				AzureRegistryUsername: nonSecret["azure_registry_username"],
			},
		}
		return r, nil
	case constants.DOCKER_PRIVATE:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &dockerprivate.RegistryDockerPrivate{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: dockerprivate.NonSecret{
				DockerRegistryURL: nonSecret["docker_registry_url"],
				DockerUsername:    nonSecret["docker_username"],
			},
		}
		return r, nil
	case constants.HARBOR:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &harbor.RegistryHarbor{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: harbor.NonSecret{
				HarborRegistryURL: nonSecret["harbor_registry_url"],
				HarborUsername:    nonSecret["harbor_username"],
				HarborProjectName: nonSecret["harbor_project_name"],
			},
		}
		return r, nil
	case constants.JFROG:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &jfrog.RegistryJfrog{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: jfrog.NonSecret{
				JfrogRegistryURL: nonSecret["jfrog_registry_url"],
				JfrogRepository:  nonSecret["jfrog_repository"],
				JfrogUsername:    nonSecret["jfrog_username"],
			},
		}
		return r, nil
	case constants.ECR:
		var nonSecret map[string]string
		err := json.Unmarshal(row.NonSecret, &nonSecret)
		if err != nil {
			return nil, err
		}
		r = &ecr.RegistryECR{
			RegistryType: row.RegistryType,
			Name:         row.Name,
			NonSecret: ecr.NonSecret{
				UseIAMRole:           nonSecret["use_iam_role"],
				IsPublic:             nonSecret["is_public"],
				AWSAccessKeyID:       nonSecret["aws_access_key_id"],
				AWSRegionName:        nonSecret["aws_region_name"],
				AWSAccountID:         nonSecret["aws_account_id"],
				TargetAccountRoleARN: nonSecret["target_account_role_arn"],
			},
		}
		return r, nil
	}
	return r, err
}

// Registry is the interface for all the supported registries
type Registry interface {
	IsValidCredential() bool
	EncryptSecret(aes encryption.AES) error
	DecryptSecret(aes encryption.AES) error
	EncryptExtras(aes encryption.AES) error
	DecryptExtras(aes encryption.AES) error
	GetSecret() map[string]interface{}
	GetExtras() map[string]interface{}
	FetchImagesFromRegistry() ([]model.IngestedContainerImage, error)
	GetNamespace() string
	GetRegistryType() string
	GetUsername() string
}
