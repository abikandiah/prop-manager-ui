import { NotFound as InternalNotFound } from "@abumble/design-system/components/NotFound";
import { TextLink } from "./ui";

function NotFound() {

	return (
		<InternalNotFound>
			<TextLink to="/">
				Return home
			</TextLink>
		</InternalNotFound>
	)
}

export { NotFound };
